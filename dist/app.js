import { toString } from './MdtEncoder.js';
import { fromString } from './MdtDecoder.js';
// 1. 先解析真实MDT路线数据
const sourceString = '!nsvxVTjmu0FqtdXfJ5JhxuLM6wfnB0x2lwneUoZBUWeX0L9s)TpdyBO400Oi5a2N75EUN7fZa2dSY2QFH7vh1pwabHd70W2WkRTBusZscIyfrdp)rioliNvq0VmEArSEzdRGoC6gzBBTS)OIn8BmcF6IOPbulDXPqqYvsh5S0bWc6Orqa56OtPjrW5I99s1)mX)xe)nRiC4XN3j7XH0TVVRdBu303CaBBUT(KMzymZhrP24eTnAykhWT9sPrAkeFs0CWWyNGRUNZpIJEToG)OrUW2x(30sKBHyxCU65G58O5dh0vRSTJvY5eKZxrGfk1XtIlDX(PJ4NetEJFZ8oK1CCvywO5(rBiK6T1YcHGRcZcn1viz(Yp2N61An34rwm0l4N8QjzKmHjzb0mNmmvy6sze6ofMTBWyUzVZuqYemi0Zgx64tkZMv)PIxjiyU9dgpAzXaZkaGz9g61vMAZz(2bH63mYotDq812S0i2kp6IZAt9VCFrer9z3Ux2LDJxjYO52x06rICZiHlGWvJXgEn0cxOsSFT6aL8MG3b2gUZBIVI7bCJfPV)hVZ3Vv2xjXNrPdQcpPx)(orn2fC79V8427Ey7lp(biJv(uTy4ouEhI)Svw)LwrdwZQM3XCtzfEOxihVR0WAVOMv(TYnj39PFC60x)SEp2)b';
console.log('1. 解析原始字符串:');
const decodedData = fromString(sourceString);
console.log('解析结果:', JSON.stringify(decodedData, null, 2));
// 2. 将解析出的数据重新编码
console.log('\n2. 重新编码解析后的数据:');
const reEncodedString = toString(decodedData);
console.log('Re-encoded string length:', reEncodedString.length);
console.log('Original string length:', sourceString.length);
console.log('编码结果:', reEncodedString);
// 3. 对比原始字符串和重新编码的字符串是否一致
console.log('\n3. 验证结果:');
console.log('编码结果与原始字符串是否相同:', sourceString === reEncodedString);
// 4. 如果不同,再次解析重编码的字符串进行对比
if (sourceString !== reEncodedString) {
    console.log('\n4. 解析重编码的字符串:');
    const reDecodedData = fromString(reEncodedString);
    console.log('数据结构是否相同:', JSON.stringify(decodedData) === JSON.stringify(reDecodedData));
}
