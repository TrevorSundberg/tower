from pathlib import Path
import sys
data = Path(sys.argv[1]).read_bytes()
Path(sys.argv[2]).write_text('static const unsigned char tower_runtime_object[] = {\n' +
    ',\n'.join(','.join(str(x) for x in data[i:i+32]) for i in range(0, len(data), 32)) + '\n};\n')
