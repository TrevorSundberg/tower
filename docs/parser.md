# Parser

An important concept in Tower is that the features of the language are defined within the language itself, including in your own code. Tower allows the user to add new parse rules to the language and implement their behavior. A common use of this is to add new syntax sugar that when parsed, is transformed into the expanded verbose version. For example, for-each loops in Tower can be written as:

```ts
// Tower uses a familiar syntax to Extended Backus-Naur Form (EBNF)
parse ForEachLoop = "for" Identifier "in" Expression Statements => replace(
  {
    let __iterator = $Expression;
    loop {
      if (__iterator.empty()) {
        break;
      }
      let $Identifier = __iterator.next();
      $Statements
    }
  }
)
```

This allows Tower to parse for-each loops in the format:

```ts
for foo in bar {
  print(foo);
}
```

1. `foo` is parsed as an Identifier
2. `bar` is parsed as an Expression
3. `{ print(foo); }` is parsed as Statements

And transform them into:

```ts
{
  let __iterator = bar;
  loop {
    if (__iterator.empty()) {
      break;
    }
    let foo = __iterator.next();
    {
      print(foo);
    }
  }
}
```

Tower was greatly inspired by pondering why we can't write C++ style Range-based For loop in langauge:

https://en.cppreference.com/w/cpp/language/range-for.html (See Explanation and how it expands to more C++ code)


At the base of tower is a primitive SSA (Static Single Assignment) form instruction set similar to LLVM which includes basic blocks, conditional and uncoditional jumps, and primitive operations.

```ts
parse If = "if" Expression Statements => replace(
  let conditional = $Expression;
  goto_if(conditional, __if_true, __if_false);
__if_true:
  $Statements;
__if_false:
);
```

```ts
parse Loop = "loop" Statements => replace(
__loop_start:
  $Statements
__loop_continue:
  goto(__loop_start);
__loop_exit:
);
```

```ts
parse Break = "break" => replace(
  goto(__loop_exit);
);
```

```ts
parse Continue = "continue" => replace(
  goto(__loop_continue);
);
```

Just like we saw with the range based for loop, we can also write other primitive loops using the above concepts:

```ts
parse WhileLoop = "while" Expression Statements => replace(
  loop {
    if !$Expression
    {
      break;
    }
    $Statements;
  }
);
```

And with the above definitions, we could now write code like:

```ts
if isSunny {
  print("go surfing!");

  while isSunny {
    catchRadWaves();
  }
}
```


The Identifier, Expression, and Statements are simply other grammar rules defined within the standard library of Tower. Tower uses a clever technique that pre-parses transformations and performs simple Abstract Syntax Tree (AST) substitutions to keep parsing fast.

## Grammar Rule Syntax

The syntax for Tower's EBNF style grammar rules is implemented within Tower itself:

```ts
// An identifier is any letter or underscore, followed by any number of letters, numbers, or underscores
token Identifier = [a-zA-Z_][a-zA-Z0-9_]*;

// A string literal is quoted, and allows escapes
token String = '"' ([^"\\] | "\\\"" | "\\\\") '"';

// Define a new rule that is either a transform or has a code handler
parse Rule = ("token" | "parse") Identifier ("=" | "|=") RuleAlternation ("=>" RuleHandler)? ";";

// Alternation: A | B | C parses any one and only one of A, B, or C
parse RuleAlternation = RuleConcatenation ("|" RuleConcatenation)*;

// Concatenation: A B parses A first and then B
parse RuleConcatenation = RuleUnaryOperators RuleUnaryOperators*;

// Unary Operators: A*, A+, A?
parse RuleUnaryOperators = RuleValue [*+?]*;

// Character Sets: [abc], [a-z], [^abc], [abc-], etc
token RuleCharacterClass = "[" $Not("^"?) (RuleCharacterClassRange | RuleCharacterClassChar)+ "]";

// Character ranges, such as "a-z"
token RuleCharacterClassRange = RuleCharacterClassChar "-" RuleCharacterClassChar;

// Match any character except ] or \, but allow escaping \] or \\ so we can write [a-z\]]
token RuleCharacterClassChar = [^\]\\] | "\]" | "\\";

// A capture group captures all the AST nodes in a parse
parse RuleCapture = "$" Identifier "(" RuleAlternation ")"

// Values and grouped expressions
parse RuleValue = Identifier | String | RuleCharacterClassRange | RuleCapture | "(" RuleAlternation ")";

// Handle the rule in one of the following ways
parse RuleHandler =
  "replace" "(" UserCode ")"  | // Replace parsed rule with with parsed user code
  "wasm" "(" Wasm ")"         | // Run WASM code that has access to the Tower compiler API
  "run" "(" UserCode ")"      | // Run user code that has access to the Tower compiler API
  "discard"                   ; // Skip/ignore the parsed text, used to skip whitespace
```

Rules may refer to other rules by name (also called non-terminals in EBNF). To support recursion, Tower allows you to reference a rule name before it is defined. Tower will only apply new rules once all referenced rule names have been defined. It is an error Tower reaches the end of code and a rule is left undefined.

## Tokenizing and Parsing

Tower uses an incremental tokenizer and parser to allow it to pause and execute custom user code in the middle of a parse. Tower reads input in two phases, tokenization and parsing. Tokenization is the process of turning a stream of characters into individual words and symbols, as well as discarding inputs such as whitespace. Parsing is the process of taking that stream of tokens and turning it into an Abstract Syntax Tree (AST).

Whitespace for example is handled as follows:
```ts
token Whitespace = [ \t\r\n\f]+ => discard;
```

## Grammar Rule Operators

Tower's rule syntax has the following operators:

| Precedence      | Operator    | Description                                       |
|-----------------|-------------|---------------------------------------------------|
| 1               | (...)       | Grouping                                          |
|                 | $Id(...)    | Capture a group by name                           |
|                 | Id          | Reference a rule by name                          |
|                 | "abc"       | Match the sequence of characters (String)         |
|                 | [abc]       | Match any of the characters                       |
|                 | [a-z]       | Match a range of characters                       |
|                 | [^abc]      | Match anything except the characters              |
| 2               | *           | Zero or more of the previous (Kleene Closure)     |
|                 | +           | One or more of the previous (Positive Closure)    |
|                 | ?           | Optional, zero or one of the previous             |
| 3               | A B         | Concatenation                                     |
| 4               | A \| B      | Alternation                                       |


## Productions and Redefines

Tower parse and token rules uses the operator `=` to completely define a rule, and `|=` to add another alternation to it (often referred to as productions in in EBNF):
```ts
A = X;
A |= Y;
```

Is the same as:
```ts
A = X | Y;
```

Note that `|=` can be used even if the rule has never been defined before:
```ts
A |= X; // Legal, even though A was never defined
```

Using the `=` operator will redefine the rule.

```ts
A = X;
A = Y; // Now A is only Y
```

When redefining a rule, you can also use the `this` keyword to refer to a rule's previous value.

```ts
A = X;
A = Y | this; // Now A is Y | X
```

Interestingly, the only built in parse rules for Tower are BNF. Tower uses rule redefines to extend the BNF syntax to a more advanced EBNF like syntax with more operators.

## User Code

The concept of "user code" refers to code that is written within the language, according to all the parse rules currently applied. When rules are added, modified, or deleted, it changes the concept of what "user code" can be validly parsed after the rule is completed (all rule references are known) and applied.

```ts
let a = @@@; // error: invalid parse, unknown token @

// At this point, user code does not include @@@ in expressions

// Extend expressions to also parse the string @@@
parse Expression = '@@@' => replace(123);

// Now user code has the concept of parsing @@@

let b = @@@; // successful parse, b is now 123

// Because @@@ is now part of user code, it can be used in replacements too
parse Expression = '%%%' => replace(@@@ + 1);

// Now user code has the concept of parsing %%%

let c = %%%; // successful parse, c is now 124
```

It is important to note that if a rule is incomplete, it will not be applied in code until all rules are resolved. For example:


```ts
let a = @bar; // error: invalid parse, unknown token @

// At this point, user code does not include @ in expressions

// Extend expressions to also parse @ with specific keywords after it
parse Expression = '@' MyKeywords => replace(123);

let b = @bar; // error: invalid parse, unknown token @

parse MyKeywords = "foo" | "bar" | "baz";

let c = @bar; // successful parse, c is now 123
```

## Rule Replacements

To apply a rule replacement, use `=> replace(user code)` after the rule. The user code provided will be parsed using the complete rules up to that point.

- $Expression operator
- User code
- What does it mean if the name we referencm e has more than one capture, how can I just insert that

# Tasks & Dependencies

This part is still being worked out, but the concept is that an Abstract Syntax Tree is sometimes difficult to work with, and to make it easier, we take inspiration from UI frameworks like React. The idea is that React takes in values as dependencies and automatically rebuilds parts of the UI tree (React elements) when any dependency changes. This means that some nodes in the AST are somewhat ephemeral and can change or be rebuilt.

A great example of this would be how template evaluation works, we end up building out a new ephermeral tree of AST nodes based on the template definition and whatever types T we are given. However, most compilers would stop there, but to support minimal rebuild at runtime, especially when the language is being run in live mode, we should only rebuild parts of the tree when aspects of T changes, not the entire thing.

Tasks are effectively React components that define how these nodes get created and react based on the dependencies taken in.
