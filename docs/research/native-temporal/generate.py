"""Build real LLVM native objects. No Python executes inside a timed workload.

The tiny frontend emits ordinary LLVM loads/stores, then a closed-module lowering
replaces EVERY load/store in tracked variants. It rejects unknown memory effects.
This is a controlled IR frontend, not a general C/C++ instrumentation pass.
"""
from pathlib import Path
import argparse
import json
import llvmlite
from llvmlite import ir, binding as llvm


def build(name):
    m = ir.Module(name=name)
    u64, u32 = ir.IntType(64), ir.IntType(32)
    fn = ir.Function(m, ir.FunctionType(ir.VoidType(), [ir.IntType(8).as_pointer(),
                     u64.as_pointer(), u32, u32, u32]), name=name)
    ctx, state, entity, neighbor, work = fn.args
    b = ir.IRBuilder(fn.append_basic_block('entry'))
    # Four cells/entity: position, velocity, captured input, immutable coefficient.
    base = b.mul(entity, u32(4))
    def addr(index):
        return b.gep(state, [b.zext(index, u64)])
    p = addr(base)
    v = addr(b.add(base, u32(1)))
    inp = addr(b.add(base, u32(2)))
    coeff = addr(b.add(base, u32(3)))
    other = addr(b.mul(neighbor, u32(4)))
    # Six reads (including a deliberate repeat), two writes. Arithmetic wraps.
    x, velocity, command = b.load(p), b.load(v), b.load(inp)
    c, adjacent, c2 = b.load(coeff), b.load(other), b.load(coeff)
    initial = b.xor(b.add(b.add(x, command), b.add(adjacent, c)), c2)
    loop = fn.append_basic_block('work')
    done = fn.append_basic_block('done')
    b.cbranch(b.icmp_unsigned('==', work, u32(0)), done, loop)
    b.position_at_end(loop)
    i = b.phi(u32); i.add_incoming(u32(0), fn.blocks[0])
    acc = b.phi(u64); acc.add_incoming(initial, fn.blocks[0])
    mixed = b.xor(b.mul(acc, u64(6364136223846793005)), b.lshr(acc, u64(23)))
    next_i = b.add(i, u32(1))
    b.cbranch(b.icmp_unsigned('<', next_i, work), loop, done)
    i.add_incoming(next_i, loop); acc.add_incoming(mixed, loop)
    b.position_at_end(done)
    result = b.phi(u64)
    result.add_incoming(initial, fn.blocks[0]); result.add_incoming(mixed, loop)
    new_v = b.add(velocity, b.and_(result, u64(65535)))
    b.store(new_v, v)
    b.store(b.add(x, new_v), p)
    b.ret_void()
    return m, fn


def lower(m, fn, mode):
    original = [ins for block in fn.blocks for ins in block.instructions]
    loads = sum(ins.opname == 'load' for ins in original)
    stores = sum(ins.opname == 'store' for ins in original)
    u64 = ir.IntType(64)
    ctx = fn.args[0]
    load_fn = ir.Function(m, ir.FunctionType(u64, [u64.as_pointer(), u64]), 'builtin_temporal_load')
    store_fn = ir.Function(m, ir.FunctionType(ir.VoidType(),
                           [u64.as_pointer(), u64, u64] if mode == 'tracked' else
                           [ctx.type, u64.as_pointer(), u64]),
                           'builtin_temporal_store' if mode == 'tracked' else 'nt_undo_store')
    for ins in original:
        if ins.opname == 'store':
            b = ir.IRBuilder(ins.parent); b.position_before(ins)
            b.call(store_fn, [ins.operands[1], ins.operands[0], u64(8)] if mode == 'tracked' else
                   [ctx, ins.operands[1], ins.operands[0]])
            ins.parent.instructions.remove(ins)
        elif ins.opname == 'load' and mode == 'tracked':
            b = ir.IRBuilder(ins.parent); b.position_before(ins)
            replacement = b.call(load_fn, [ins.operands[0], u64(8)])
            for block in fn.blocks:
                for use in block.instructions:
                    use.replace_usage(ins, replacement)
            ins.parent.instructions.remove(ins)
    # There is no pointer escape, FFI, atomics, bulk copy or hidden helper here.
    allowed = {'getelementptr', 'zext', 'add', 'mul', 'xor', 'lshr', 'and',
               'icmp', 'br', 'phi', 'ret void', 'call'}
    if mode == 'undo': allowed.add('load')
    for block in fn.blocks:
        for ins in block.instructions:
            if ins.opname not in allowed:
                raise ValueError(f'unhandled operation: {ins.opname}')
    assert loads == 6 and stores == 2
    return {'original_loads': loads, 'original_stores': stores,
            'remaining_raw_loads': sum(i.opname == 'load' for b in fn.blocks for i in b.instructions),
            'remaining_raw_stores': sum(i.opname == 'store' for b in fn.blocks for i in b.instructions)}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--out', type=Path, required=True)
    args = ap.parse_args(); args.out.mkdir(parents=True, exist_ok=True)
    llvm.initialize_native_target(); llvm.initialize_native_asmprinter()
    target = llvm.Target.from_default_triple()
    machine = target.create_target_machine(cpu='generic', opt=3, codemodel='default')
    audit = {'llvmlite': llvmlite.__version__, 'llvm': llvm.llvm_version_info,
             'triple': llvm.get_default_triple(), 'cpu': 'generic', 'variants': {}}
    for mode in ['plain', 'undo', 'tracked']:
        m, fn = build('kernel_' + mode)
        m.triple = llvm.get_default_triple(); m.data_layout = str(machine.target_data)
        if mode != 'plain': audit['variants'][mode] = lower(m, fn, mode)
        (args.out / f'{mode}.ll').write_text(str(m))
        native = llvm.parse_assembly(str(m)); native.verify()
        tuning = llvm.create_pipeline_tuning_options(speed_level=3)
        passes = llvm.create_pass_builder(machine, tuning)
        passes.getModulePassManager().run(native, passes)
        native.verify()
        (args.out / f'{mode}.opt.ll').write_text(str(native))
        (args.out / f'{mode}.asm').write_text(machine.emit_assembly(native))
        (args.out / f'{mode}.obj').write_bytes(machine.emit_object(native))
    (args.out / 'llvm-audit.json').write_text(json.dumps(audit, indent=2) + '\n')
    print(json.dumps(audit, indent=2))


if __name__ == '__main__': main()
