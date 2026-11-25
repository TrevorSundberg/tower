#!/usr/bin/env bash
# Install the public development bootstrap into a user-owned prefix.
set -euo pipefail
unset CDPATH

die() { printf '%s\n' "$*" >&2; exit 1; }

[[ $# == 1 && -n $1 ]] || die "Usage: install.sh PREFIX"
host=$(uname -sm)
[[ $host == 'Linux x86_64' ]] || die "Unsupported host: $host (requires Linux x86_64)"
command -v clang-19 >/dev/null || die "Missing clang-19. Install the Ubuntu LLVM/Clang 19 prerequisites."

revision=93210484312acb83f2c49b306dc60fd57d49848a
url="https://raw.githubusercontent.com/TrevorSundberg/tower/$revision/bootstrap/linux-x64"
sums=75eac77a42e1feb41bc538708e28341bd99ac8ba6f5862251aff87e978b0d804
check_list() {
    printf '%s  SHA256SUMS\n' "$sums" | sha256sum --strict --check --quiet
}
check_package() {
    sha256sum --strict --check --quiet SHA256SUMS
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
    check_list
    check_package
)
printf '%s\n' "$dest/towerc"
