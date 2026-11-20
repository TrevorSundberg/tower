// Display lexers for external backend syntaxes only. Tower output uses the same
// Wasm lexer and decorations as source input (see tower-highlights.mjs).
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
  if (syntax === 'tower') throw new Error('Tower highlighting requires the shared compiler lexer');
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
      if (syntax === 'brightscript' && stream.match(/^'|^rem\b/i)) { stream.skipToEnd(); return 'comment'; }
      if (syntax === 'brightscript' && stream.match(/^"(?:[^"]|"")*"/)) return 'string';
      if (syntax === 'brightscript' && stream.match(/^&h[\da-f]+&?|^\d+&/i)) return 'number';
      if (stream.match('//') || !['c','brightscript'].includes(syntax) && stream.match(';')) { stream.skipToEnd(); return 'comment'; }
      if (syntax === 'c' && stream.match('/*')) { state.comment=true; return 'comment'; }
      if (syntax === 'c' && stream.match(/^\s*#\s*\w+/)) return 'meta';
      if (stream.match(/^(?:"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)/)) return 'string';
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
        if (syntax === 'brightscript') {
          if (/^(?:function|sub|end|if|then|else|for|to|step|each|in|while|exit|return|goto|and|or|not|mod|as|throw|try|catch|print)$/i.test(word)) return 'keyword';
          if (/^(?:integer|longinteger|string|boolean|dynamic|object|float|double|void)$/i.test(word)) return 'typeName';
          if (/^(?:true|false|invalid)$/i.test(word)) return 'meta';
        } else if (syntax === 'c') {
          if (/^(?:if|else|for|while|do|break|continue|return|goto|switch|case|default|sizeof|typedef|extern|static|inline|const|volatile)$/.test(word)) return 'keyword';
          if (/^(?:void|char|short|int|long|signed|unsigned|struct|union|enum|size_t|u?int(?:ptr|8|16|32|64)_t)$/.test(word)) return 'typeName';
          if (/^(?:NULL|TC_\w+|UINT\w+|INT\w+)$/.test(word)) return 'meta';
        } else if (llvmKeywords.has(word)) return 'keyword';
        if (/^(?:[iu]\d+|[iu]size|bool|void|ptr|float|double|half|type)$/.test(word)) return 'typeName';
        if (stream.match(/^\s*:/, false)) return 'labelName';
        if (stream.match(/^\s*\(/, false)) return 'variableName.function';
        return null;
      }
      stream.next(); return 'operator';
    },
  };
}
