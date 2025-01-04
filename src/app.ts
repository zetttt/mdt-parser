import { toString } from './MdtEncoder.js';
import { fromString } from './MdtDecoder.js';

// 1. 先解析真实MDT路线数据
const sourceString = '!nA1YoYjmqW)OiSnpVhPOSrAYkroBPLbZesyHKby3jFv5qoSs5s(CY(zeCBOBBJNr5spmq7Q7Q6YgKm5NKLdvFrDCAC5YjzzDBtt7X5UPFipWIEtKS8zL6RYdz6lF6HUzLEjhNpFw1p925(tQH(3xFzjzMqNYOQBbS2HEdCRjE)Cx3sk6eMuQhB7pjpaGFUTz6JnnJQT6)TLm1xcj7(ZbrQoYXGacj6ym(F4VcD7EifFsg(KC8bf6adaci6wK59qoSeGDh4aqmatoGcdqLd3Hz6p4omitoSkgGa3GjefgKHckGi3WqDCYqVnwNH8nfjzoYmdQjeqPe(z2qkSGmXbYjdu7FijQHusUzPzwl1uQYJdDdNLLnncvtJhDWut3ZurmnAfHgWgHmb1rpALTNmgz1O2KNbgMuJQBZcLhAHqicrGZd0(0KsKtTpPDghtczKsr)LhtYdWesC4K4yAPyYzLqMYuYts2w3XJq5vgC8uGvZ4KjJShRnDa3YdBRpPx1DiufRUJKa70fu5PQhtCv4YvVEYQ5jpmJ7UCpj39yfpXNYGgSfEQztLrnxPSJgr7P4udXd0fXbQDU7OWvX2PQ6XQ9(YBV)0y7Zdmbw7egB36TtF3PXOArdRemKIHmR9RW5UELOiO4Z3XvJdAlBMxJ51RmlxfpOTkjW7jmVwid9v54BjMwX5g9EINIxSAsqohTVLDWmensV6EtRtcS1PTZHrbkA)znovLQqMdupW2Sxy657fawX)X7eyB2Eraac)(iRJxc4WU2z6iyXxLG(Vu16K0O1o6MhvWsUjHxvS1KC29eAKlcFoj91uLZvDQNuDyTMuxwIV(YVQgghF9LF(3F)hz5J1T6pvR5Ss95HU67gA7v1Yk6oRFqwL60CBh8jzRWn3wllV)522XVF3LlF4Dl3t(pa';

// !nAvYUTnmq0VOwiUPL7fOOTaobv9upqaBlsx2WifOLuL)(kksnJwOdYfAjYHV5nVzXssK)sw2C5VQR9Dtp2llRmAT56GT)n5jsYNtKL)tPEsEA(XxpBhuURCDOTvv3)LH6BQM6VvnozmH5mPtzNaZ0u7Hly4Jdw7Kjod6vQNn13ci2A09pO1DQf))YKLUhNnE7pNyc3kfwyZlPUv(8JzUvbCuk8AgytoCqHBH4aQ3J3IBsbhKbqL7nJFxZCXAJTPvwQ1mLwVd0LlrZXqarNIXaLdKMkq3Wa6qloY459cAscQmuuzi(lXIYFH)WSvhs2esUaQqTdaW5ycHIoNsostF(XtZ8TjWDClIC7LakQrm0JZVtccd5(XHl1Wu7qgyhpCFYH7pZhGi7Q)wmZZcm9HzVui5LfCrYrxuSBl0pRZdfHslrW61CLFKRmSCJHLBSIi0GdwoV9ogX2EAiQduNSojl2P46lEfpncJfrymYdglAtUiMgIjfsm9KEOC2tQqPYAcWtaO4yOZXEjolcbYJOeV3acF3uEenjnsfh23qX(g)4bo2)lWrjPWOGTrTV4zrAYpwfskENMNIqQeICw0A2L(O0DzA)PPBlN4WD3n3EbfEuuirqHVbLydKbHM)bg37Xdv2L2cI4dmNekey3DYrSXsG5RVgM9ZJOS0vqJtLMZJbXnhLUeiGjW8ipCXAzbzk5WuMfJRsiAQZy8)6lhUyvVQSG40RgNwp3E(tp5w6gQTV1jlFUY4(ucDRs9NgB13Bm1Qk5fCNWhmCrDBWyN)KHaGdMQjT(fZpnJ)EC8hFDAp5)b

// !9n1YUTnmqWpOIk4Lupp2GcueKah3YCPxiIT1shLWivitL6EjF7LAxkzAa5aiqiXDMzNDePg0pQvD7Eb37oo(kWlQSY8eHw5F(kKwMuPvs9A)(P6BmBThrTQD6n3imMLiRijJzLwaj5FolzGfaZSYeqI8tz55v3ymn7hSU)Px7j9xeFvVELw9(w7aoQ5(H(ES199H2dyx7T1N8YbEbpIw)C2016b5MHTzWAP(5q8TM2dKw9ng3dgZrKIfp4)4rfNq0YilbzcVJLrjXCHZJPFRXE2z761kJrIgtebgcLcR5ylnwozSqKQPlO6OMvXrldPkgprol(JiljXiOmKcYsLXMjnwIl7FvyQ4QlHXym742KpwnpaPKAd50IP2SI2dcNIOiOCHCpFSaSkEyJYdUxfX9ceSWal8Q4Mc8VaGMr4A)64qMmJyEaCN7Gmlwtws5L(KghqCL)ICkwf7AXfAYFvUORNAHGdqXLUVke)byZGzfOkWIUA6eBOC(cG2ctbEyYw6u65Z(H8T4kHqv4(E4EQAyNfFhTbGo8KF9xBBQX(KBF4JN2C)JB(4PVa(JsVv3mQPPhXN7S105LD4HHglD)M4p0uRv)uDt(9F73NoD3p0U)d

console.log('1. 解析原始字符串:');
const decodedData = fromString(sourceString);
console.log('解析结果:', JSON.stringify(decodedData, null, 2));

// 2. 将解析出的数据重新编码
console.log('\n2. 重新编码解析后的数据:');
const reEncodedString = await toString(decodedData);
console.log('Re-encoded string length:', reEncodedString.length);
console.log('Original string length:', sourceString.length);
console.log('编码结果:', reEncodedString);

// 3. 对比原始字符串和重新编码的字符串是否一致
console.log('\n3. 验证结果:');
console.log('编码结果与原始字符串是否相同:', sourceString === reEncodedString);

// 4. 如果不同,再次解析重编码的字符串进行对比
if(sourceString !== reEncodedString) {
  console.log('\n4. 解析重编码的字符串:');
  const reDecodedData = fromString(reEncodedString);
  console.log('数据结构是否相同:', JSON.stringify(decodedData) === JSON.stringify(reDecodedData));
}