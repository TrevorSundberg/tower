// Display lexers only. Tower parsing, validation and canonical formatting remain
// owned by the compiler and its shared foundation nodes.
const towerKeywords = new Set('var fn return if else loop break continue struct extern export template parse token skip replace as true false null'.split(' '));
const llvmKeywords = new Set(('define declare target datalayout triple source_filename attributes ' +
  'alloca load store getelementptr call ret br switch phi select icmp fcmp add sub mul udiv sdiv urem srem ' +
  'fadd fsub fmul fdiv frem and or xor shl lshr ashr trunc zext sext fptrunc fpext fptoui fptosi uitofp sitofp ' +
  'ptrtoint inttoptr bitcast addrspacecast extractvalue insertvalue extractelement insertelement shufflevector ' +
  'unreachable freeze fence cmpxchg atomicrmw invoke landingpad resume atomic volatile inbounds nsw nuw exact ' +
  'align private internal external global constant unnamed_addr local_unnamed_addr dso_local nounwind ' +
  'noreturn noalias nocapture readonly readnone noundef zeroinitializer poison undef true false null').split(' '));
const x86Register = /^(?:[re]?(?:ax|bx|cx|dx|sp|bp|si|di|ip)|[abcd][lh]|[sb]pl|[sd]il|r(?:[89]|[12]\d|3[01])(?:[dwb])?|(?:xmm|ymm|zmm|mm|k|st|cr|dr)\d+|[cdefgs]s|[re]?flags)$/i;
const armRegister = /^(?:[xw](?:[12]?\d|30)|[vqdsbh](?:[12]?\d|3[01])(?:\.[0-9]*[bhsd])?|[xw]zr|[w]?sp|fp|lr|pc)$/i;

export function outputParser(syntax) {
  const assembly = ['x86', 'arm', 'wasm'].includes(syntax);
  return {
    name: 'tower-output-' + syntax,
    startState: () => ({ comment: false, instruction: false }),
    token(stream, state) {
      if (stream.sol()) state.instruction = false;
      if (state.comment) {
        while (!stream.eol()) if (stream.match('*/')) { state.comment = false; break; } else stream.next();
        return 'comment';
      }
      if (stream.eatSpace()) return null;
      if (stream.match('//') || (syntax !== 'tower' && stream.match(';'))) { stream.skipToEnd(); return 'comment'; }
      if (syntax === 'tower' && stream.match('/*')) { state.comment = true; return 'comment'; }
      if (stream.match(/^(?:"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)/)) return 'string';
      if (syntax === 'tower' && stream.match(/^`(?:[^`\\]|\\.)*`?/)) return 'variableName';
      if (assembly && stream.sol() && stream.match(/^0x[\da-f]+\s+/i)) { state.instruction = true; return 'number'; }
      if (assembly && stream.match(/^[.$\w][.$\w<>\[\] -]*:/)) return 'labelName';
      if (syntax === 'llvm' && stream.match(/^[@%](?:"(?:[^"\\]|\\.)*"|[-\w.$]+)/)) return 'variableName';
      if (syntax === 'llvm' && stream.match(/^![\w.]+|^#\d+/)) return 'meta';
      if (stream.match(/^[+-]?(?:0x[\da-f]+|\d+(?:\.\d*)?(?:e[+-]?\d+)?)/i)) return 'number';
      if (stream.match(/^[\w.$][\w.$-]*/)) {
        const word = stream.current();
        if (assembly) {
          if (state.instruction) {
            state.instruction = syntax === 'x86' && /^(?:lock|rep|repe|repz|repne|repnz)$/i.test(word);
            return 'keyword';
          }
          if ((syntax === 'x86' ? x86Register : armRegister).test(word)) return 'variableName.special';
          if (syntax === 'wasm' && /^(?:[if]\d+|local|global|memory|table)\./.test(word)) return 'keyword';
          if (/^(?:byte|word|dword|qword|ptr)$/i.test(word)) return 'typeName';
          return word.startsWith('.') ? 'meta' : null;
        }
        if ((syntax === 'tower' ? towerKeywords : llvmKeywords).has(word)) return 'keyword';
        if (/^(?:[iu]\d+|[iu]size|bool|void|ptr|float|double|half|type)$/.test(word)) return 'typeName';
        if (stream.match(/^\s*:/, false)) return 'labelName';
        if (stream.match(/^\s*\(/, false)) return 'variableName.function';
        return null;
      }
      stream.next(); return 'operator';
    },
  };
}
