#!/bin/bash
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
exec bash "$HERE/experiments/fracture-phone-tv/Start_Fracture_Chaos_Test.command"
