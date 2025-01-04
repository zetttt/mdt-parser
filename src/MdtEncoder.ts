import pako from 'pako';

export class MdtEncoder {
  private static readonly ByteToB64: string[] = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '(', ')'
  ];

  static async encode(data: any): Promise<string> {
    try {
      // 序列化数据
      const serialized = this.serializeAce(data);
      
      // 压缩数据
      const [compressed, usesDeflate] = this.compress(serialized);
      
      // 编码为base64
      const encoded = this.encodeForWoWAddon(compressed);
      
      // 添加压缩标记
      return usesDeflate ? `!${encoded}` : encoded;
      
    } catch(e) {
      console.error('Error converting table to string:', e);
      return '';
    }
  }

  private static serializeAce(data: any): string {
    if (data === null || data === undefined) {
      return '';
    }

    const result: string[] = ['^1']; // AceSerializer版本标记

    function serializeValue(value: any): void {
      if (typeof value === 'object' && value !== null) {
        result.push('^T');
        for (const [key, val] of Object.entries(value)) {
          if (typeof key === 'string') {
            result.push('^S', key);
          } else {
            // 处理数字键
            const numKey = Number(key);
            if (!isNaN(numKey)) {
              result.push('^N', numKey.toString());
            }
          }
          serializeValue(val);
        }
        result.push('^t');
      } else if (typeof value === 'string') {
        result.push('^S', value);
      } else if (typeof value === 'number') {
        result.push('^N', value.toString());
      } else if (typeof value === 'boolean') {
        result.push('^B', value ? 'true' : 'false');
      }
    }

    serializeValue(data);
    return result.join('');
  }

  private static compress(data: string): [Uint8Array, boolean] {
    try {
      // 尝试使用deflate压缩
      const deflated = pako.deflate(data, { windowBits: -15 });
      return [deflated, true];
    } catch {
      // 如果压缩失败，返回原始数据
      const encoder = new TextEncoder();
      return [encoder.encode(data), false];
    }
  }

  private static encodeForWoWAddon(data: Uint8Array): string {
    let result = '';
    let bits = 0;
    let bitsLength = 0;

    for (let i = 0; i < data.length; i++) {
      bits = bits + (data[i] << bitsLength);
      bitsLength += 8;
      
      while (bitsLength >= 6) {
        result += this.ByteToB64[bits & 0x3F];
        bits = bits >> 6;
        bitsLength -= 6;
      }
    }

    // 处理剩余位
    if (bitsLength > 0) {
      result += this.ByteToB64[bits & 0x3F];
    }

    return result;
  }
}

// 导出便捷方法
export const toString = (data: any) => MdtEncoder.encode(data);
