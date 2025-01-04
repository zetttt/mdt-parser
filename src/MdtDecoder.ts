import pako from 'pako';

export class MdtDecoder {
  private static readonly B64toByte: { [key: string]: number } = {
    'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7, 'i': 8, 'j': 9, 'k': 10, 'l': 11,
    'm': 12, 'n': 13, 'o': 14, 'p': 15, 'q': 16, 'r': 17, 's': 18, 't': 19, 'u': 20, 'v': 21, 'w': 22,
    'x': 23, 'y': 24, 'z': 25, 'A': 26, 'B': 27, 'C': 28, 'D': 29, 'E': 30, 'F': 31, 'G': 32, 'H': 33,
    'I': 34, 'J': 35, 'K': 36, 'L': 37, 'M': 38, 'N': 39, 'O': 40, 'P': 41, 'Q': 42, 'R': 43, 'S': 44,
    'T': 45, 'U': 46, 'V': 47, 'W': 48, 'X': 49, 'Y': 50, 'Z': 51, '0': 52, '1': 53, '2': 54, '3': 55,
    '4': 56, '5': 57, '6': 58, '7': 59, '8': 60, '9': 61, '(': 62, ')': 63
  };

  static decode(input: string): any {
    try {
      // 检查压缩标记
      const [encoded, usesDeflate] = this.checkCompression(input);
      
      // 解码 base64
      const decoded = this.decodeForWoWAddon(encoded);
      
      // 解压缩
      return usesDeflate ? 
        this.decompressDeflate(decoded) : 
        this.decompress(decoded);
      
    } catch(e) {
      console.error('Error converting string to table:', e);
      return null;
    }
  }

  private static checkCompression(str: string): [string, boolean] {
    const result = str.replace(/^!/, '');
    return [result, str !== result];
  }

  private static decodeForWoWAddon(str: string): Uint8Array {
    const cleaned = str.replace(/[^a-zA-Z0-9()]/g, '');
    const decoded = new Uint8Array(Math.floor(cleaned.length * 6 / 8));
    let bits = 0;
    let bitsLength = 0;
    let index = 0;

    for (let i = 0; i < cleaned.length; i++) {
      const ch = this.B64toByte[cleaned[i]];
      if (ch === undefined) {
        throw new Error(`Invalid base64 character: ${cleaned[i]}`);
      }
      bits = bits + (ch << bitsLength);
      bitsLength += 6;
      
      while (bitsLength >= 8) {
        decoded[index++] = bits & 0xFF;
        bits = bits >> 8;
        bitsLength -= 8;
      }
    }

    // 处理剩余位
    if (bitsLength > 0) {
      decoded[index++] = bits << (8 - bitsLength);
    }

    return decoded.slice(0, index);
  }

  private static deserializeAce(data: string): any {
    if (!data) {
      throw new Error('Empty data to deserialize');
    }
    data = data.trim();
    if (!data.startsWith('^1')) {
      throw new Error('Invalid AceSerializer format - missing version mark');
    }
    if (data.length < 4) {
      throw new Error('Invalid AceSerializer format - data too short');
    }

    function processValue(tokens: string[], index: number): [any, number] {
      const token = tokens[index];
      if (token === '^T') {
        const obj: any = {};
        let i = index + 1;
        
        while (i < tokens.length && tokens[i] !== '^t') {
          let key;
          if (tokens[i] === '^S') {
            key = tokens[i + 1];
            i += 2;
          } else if (tokens[i] === '^N') {
            key = parseFloat(tokens[i + 1]);
            i += 2;
          } else {
            i++;
            continue;
          }
          
          const [value, newIndex] = processValue(tokens, i);
          if (value !== undefined) {
            obj[key] = value;
          }
          i = newIndex;
        }
        return [obj, i + 1];
      }
      
      if (token === '^S') {
        return [tokens[index + 1], index + 2];
      }
      
      if (token === '^N' || token === '^F') {
        return [parseFloat(tokens[index + 1]), index + 2];
      }
      
      if (token === '^B') {
        return [tokens[index + 1] === 'true', index + 2];
      }
      
      return [undefined, index + 1];
    }

    const tokens = data.split(/(\^[A-Za-z]|\^t|\^[0-9]+|=)/g)
      .filter(Boolean)
      .map(t => t.trim())
      .filter(t => t.length > 0);
    
    const [result] = processValue(tokens, 1);
    return result;
  }

  private static decompressDeflate(data: Uint8Array): any {
    try {
      const inflated = pako.inflate(data, { windowBits: -15 });
      const result = new TextDecoder().decode(inflated);
      return this.deserializeAce(result);
    } catch(e) {
      if (e instanceof Error) {
        throw new Error(`Decompression failed: ${e.message}`);
      }
      throw new Error('Decompression failed');
    }
  }

  private static decompress(data: Uint8Array): any {
    const decoded = new TextDecoder().decode(data);
    return this.deserializeAce(decoded);
  }
}

// 导出便捷方法
export const fromString = (input: string) => MdtDecoder.decode(input);
