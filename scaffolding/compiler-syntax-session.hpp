#pragma once
#include "compiler-syntax-version.hpp"

struct SyntaxSessionPins {
  const FrontendRevision *grammar, *baseline, *bedrock;
  SyntaxVersion *version, *completion_version;
};
extern "C" void syntax_session_pin_revision(const FrontendRevision**, const FrontendRevision*);
extern "C" void syntax_session_pin_version(SyntaxVersion**, SyntaxVersion*);
extern "C" void syntax_session_pins_baseline(SyntaxSessionPins*, const SyntaxSessionPins*);
extern "C" void syntax_session_pins_dispose(SyntaxSessionPins*);
