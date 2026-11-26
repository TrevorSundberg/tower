#!/usr/bin/env bash
# Install the public development bootstrap into a user-owned prefix.
set -euo pipefail
unset CDPATH

die() { printf '%s\n' "$*" >&2; exit 1; }

[[ $# == 1 && -n $1 ]] || die "Usage: install.sh PREFIX"
host=$(uname -sm)
[[ $host == 'Linux x86_64' ]] || die "Unsupported host: $host (requires Linux x86_64)"
command -v clang-19 >/dev/null || die "Missing clang-19. Install the Ubuntu LLVM/Clang 19 prerequisites."

revision=fb0f85deaeac4123c2f3d191312d30837c33766a
url="https://raw.githubusercontent.com/TrevorSundberg/tower/$revision/bootstrap/linux-x64"
sums=eeafe1a2b4305839fdc305f6d59f22ad6bf415925bc8afc28d622913b8aa03f8
check_list() {
    printf '%s  SHA256SUMS\n' "$sums" | sha256sum --strict --check --quiet >&2
}
check_package() {
    sha256sum --strict --check --quiet SHA256SUMS >&2
    ./towerc --version >&2
}

mkdir -p -- "$1"
cd -P -- "$1"
[[ -O . ]] || die "Install prefix must be owned by the current user: $PWD"
dest=$PWD/linux-x64
if [[ ! -e $dest && ! -L $dest ]]; then
    stage=$(mktemp -d -- "$PWD/.tower-install.XXXXXXXX")
    trap 'rm -rf -- "$stage"' EXIT
    trap 'exit 129' HUP
    trap 'exit 130' INT
    trap 'exit 143' TERM
    (
        cd -- "$stage"
        umask 022
        fetch=(curl -q --fail --silent --show-error --location --proto '=https' --proto-redir '=https'
               --connect-timeout 15 --max-time 120 --retry 2)
        "${fetch[@]}" --output SHA256SUMS "$url/SHA256SUMS"
        check_list
        # Only the authenticated public inventory supplies paths to curl.
        files=()
        while read -r _ path; do
            files+=(--output "$path" "$url/$path")
        done < SHA256SUMS
        "${fetch[@]}" --create-dirs --fail-early --parallel --parallel-max 4 "${files[@]}"
        chmod 755 towerc
        check_package
    )
    # On a concurrent install GNU mv -n leaves the losing stage in place.
    mv -nT -- "$stage" "$dest" || [[ -e $dest || -L $dest ]]
    if [[ ! -e $stage ]]; then
        printf '%s\n' "$dest/towerc"
        exit 0
    fi
fi
[[ -d $dest && ! -L $dest && -f $dest/SHA256SUMS ]] || die "Install destination is occupied: $dest"
(
    cd -- "$dest"
    check_list || die "Checksum list differs at $dest. Use a fresh prefix to keep this installation."
    check_package
)
printf '%s\n' "$dest/towerc"
