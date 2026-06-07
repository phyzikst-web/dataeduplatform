// =========================================
// 실습 12 - for in으로 상품 정보 출력하기 [정답]
// =========================================

let item = {
    name  : '무선 마우스',
    brand : '로지텍',
    price : 35000,
    stock : 12
};

for (let key in item) {
    if (key === 'price') {
        console.log(key + ': ' + item[key] + '원');
    } else if (key === 'stock') {
        console.log(key + ': ' + item[key] + '개');
    } else {
        console.log(key + ': ' + item[key]);
    }
}
