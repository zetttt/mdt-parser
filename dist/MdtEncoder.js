import pako from 'pako';
export class MdtEncoder {
    static log(...args) {
        if (this.DEBUG) {
            console.log('[MdtEncoder]', ...args);
        }
    }
    static hexdump(data, tag = '') {
        if (this.DEBUG) {
            console.log(`[MdtEncoder] Hexdump ${tag}:`);
            let hex = '';
            let text = '';
            for (let i = 0; i < Math.min(data.length, 32); i++) {
                hex += data[i].toString(16).padStart(2, '0') + ' ';
                text += data[i] >= 32 && data[i] <= 126 ? String.fromCharCode(data[i]) : '.';
                if ((i + 1) % 16 === 0) {
                    console.log(hex + ' | ' + text);
                    hex = '';
                    text = '';
                }
            }
            if (hex) {
                console.log(hex.padEnd(48, ' ') + ' | ' + text);
            }
        }
    }
    /**
     * 将表格数据转换为字符串
     * 类似于 MDT:TableToString 功能
     */
    static encode(data, forChat = false, level = 5) {
        try {
            // 1. 稳定化数据结构
            const stableData = this.stabilizeData(data);
            this.log('Stabilized data:', JSON.stringify(stableData, null, 2));
            // 2. 序列化为AceSerializer格式
            const serialized = this.serializeAce(stableData);
            this.log('Serialized data:', serialized);
            this.log('Serialized length:', serialized.length);
            // 3. 准备压缩
            const encoder = new TextEncoder();
            const bytes = encoder.encode(serialized);
            this.log('UTF8 encoded length:', bytes.length);
            this.hexdump(bytes, 'Before compression (first 32 bytes)');
            // 验证数据长度
            if (bytes.length === 0) {
                throw new Error('Empty data to compress');
            }
            if (bytes.length > 1024 * 1024) {
                throw new Error('Data too large to compress');
            }
            // 使用严格匹配LibDeflate的配置
            const compressOptions = {
                level: 5, // 固定压缩级别5
                windowBits: -15, // 使用原始deflate格式
                memLevel: 8, // 与LibDeflate一致
                strategy: 0, // Z_DEFAULT_STRATEGY
                raw: true // 无zlib头
            };
            this.log('Compression options:', compressOptions);
            // 4. 压缩数据 - 完全按照LibDeflate的流程
            // 使用统一的压缩配置
            const compressed = pako.deflateRaw(bytes, compressOptions);
            // 添加数据校验
            if (compressed.length === 0) {
                throw new Error('Compression failed: empty result');
            }
            if (compressed.length > bytes.length * 2) {
                throw new Error('Compression failed: result too large');
            }
            this.hexdump(compressed, 'After compression');
            this.log('Compressed length:', compressed.length);
            // 5. Base64编码 - 严格按照LibDeflate实现
            let result = '';
            let buffer = 0;
            let bitsInBuffer = 0;
            for (let i = 0; i < compressed.length; i++) {
                const byte = compressed[i];
                // 将一个字节压入缓冲区
                buffer = (buffer << 8) | byte;
                bitsInBuffer += 8;
                this.log(`Processing byte ${i}:`, {
                    byte: byte.toString(16),
                    buffer: buffer.toString(2).padStart(bitsInBuffer, '0'),
                    bitsInBuffer
                });
                // 每次取6位输出一个Base64字符
                while (bitsInBuffer >= 6) {
                    const chunk = (buffer >> (bitsInBuffer - 6)) & 0x3F;
                    result += this.byteToB64[chunk];
                    bitsInBuffer -= 6;
                    buffer &= (1 << bitsInBuffer) - 1;
                    this.log(`Encoded 6 bits:`, {
                        chunk: chunk.toString(2).padStart(6, '0'),
                        value: chunk,
                        char: this.byteToB64[chunk],
                        remainingBits: bitsInBuffer,
                        remainingBuffer: buffer.toString(2).padStart(bitsInBuffer, '0')
                    });
                }
            }
            // 处理末尾的位
            if (bitsInBuffer > 0) {
                // 左移补齐6位
                const padding = 6 - bitsInBuffer;
                const chunk = (buffer << padding) & 0x3F;
                result += this.byteToB64[chunk];
                // 添加填充字符
                if (padding > 0) {
                    result += this.byteToB64[0].repeat(Math.ceil(padding / 6));
                }
                this.log(`Final bits:`, {
                    bitsInBuffer,
                    padding,
                    chunk: chunk.toString(2).padStart(6, '0'),
                    value: chunk,
                    char: this.byteToB64[chunk],
                    paddingChars: padding > 0 ? this.byteToB64[0].repeat(Math.ceil(padding / 6)) : 'none'
                });
            }
            this.log('Encoded length:', result.length);
            this.log('First 50 chars:', result.substring(0, 50));
            return '!' + result;
        }
        catch (e) {
            console.error('Error encoding data:', e);
            throw e;
        }
    }
    /**
     * 稳定化数据 - 确保相同的数据总是生成相同的序列化结果
     */
    static stabilizeData(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.stabilizeData(item));
        }
        if (typeof data === 'object' && data !== null) {
            const result = {};
            // 按字母序处理所有键
            const keys = Object.keys(data).sort((a, b) => {
                const numA = parseInt(a);
                const numB = parseInt(b);
                if (!isNaN(numA) && !isNaN(numB))
                    return numA - numB;
                return a.localeCompare(b);
            });
            for (const key of keys) {
                result[key] = this.stabilizeData(data[key]);
            }
            return result;
        }
        return data;
    }
    /**
     * 序列化为 AceSerializer 格式
     */
    static serializeAce(data) {
        let result = "^1"; // AceSerializer version mark
        const serialize = (value) => {
            if (value === null || value === undefined) {
                return "^Z"; // nil value
            }
            const type = typeof value;
            if (type === "string") {
                return `^S${value}`;
            }
            if (type === "number") {
                // 确保 -0 序列化为 0
                const val = value === 0 ? 0 : value;
                return `^${Number.isInteger(val) ? 'N' : 'F'}${val}`;
            }
            if (type === "boolean") {
                return `^B${value}`;
            }
            if (type === "object") {
                let str = "^T"; // table start
                // 获取所有键并排序
                const numericKeys = [];
                const stringKeys = [];
                for (const key in value) {
                    const numKey = parseInt(key);
                    if (!isNaN(numKey) && numKey.toString() === key) {
                        numericKeys.push(numKey);
                    }
                    else {
                        stringKeys.push(key);
                    }
                }
                // 数字键按数字排序，字符串键按字母排序
                numericKeys.sort((a, b) => a - b);
                stringKeys.sort();
                // 先处理数字键
                for (const key of numericKeys) {
                    str += `^N${key}`;
                    str += serialize(value[key]);
                }
                // 再处理字符串键
                for (const key of stringKeys) {
                    str += `^S${key}`;
                    str += serialize(value[key]);
                }
                str += "^t"; // table end
                return str;
            }
            return "^Z"; // unsupported type
        };
        result += serialize(data);
        return result;
    }
}
// Base64 编码表
MdtEncoder.byteToB64 = {
    [0]: "A", [1]: "B", [2]: "C", [3]: "D", [4]: "E", [5]: "F", [6]: "G", [7]: "H",
    [8]: "I", [9]: "J", [10]: "K", [11]: "L", [12]: "M", [13]: "N", [14]: "O", [15]: "P",
    [16]: "Q", [17]: "R", [18]: "S", [19]: "T", [20]: "U", [21]: "V", [22]: "W", [23]: "X",
    [24]: "Y", [25]: "Z", [26]: "a", [27]: "b", [28]: "c", [29]: "d", [30]: "e", [31]: "f",
    [32]: "g", [33]: "h", [34]: "i", [35]: "j", [36]: "k", [37]: "l", [38]: "m", [39]: "n",
    [40]: "o", [41]: "p", [42]: "q", [43]: "r", [44]: "s", [45]: "t", [46]: "u", [47]: "v",
    [48]: "w", [49]: "x", [50]: "y", [51]: "z", [52]: "0", [53]: "1", [54]: "2", [55]: "3",
    [56]: "4", [57]: "5", [58]: "6", [59]: "7", [60]: "8", [61]: "9", [62]: "+", [63]: "/"
};
// 添加调试开关
MdtEncoder.DEBUG = false;
// 导出便捷方法
export const toString = (data, forChat, level) => MdtEncoder.encode(data, forChat, level);
