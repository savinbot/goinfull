module.exports = {
    getInlineMyOffice() {
        return [
            [{
                text: '💳 Баланс »',
                callback_data: JSON.stringify({
                    type: 'myBalance',
                })
            }],
            [{
                text: '🛒 Мои покупки »',
                callback_data: JSON.stringify({
                    type: 'MyPurchases',
                })
            }],[{
                text: '📝 Магазин »',
                callback_data: JSON.stringify({
                    type: 'backSelType',
                })
            }],
        ]
    },
    getInlineListForPost(messageId) {
        return [
            [{
                text: 'Всем подписчикам »',
                callback_data: JSON.stringify({
                    type: 'sendPostall',
                    data: messageId,
                })
            }],
            [{
                text: 'У кого баланс 0$ »',
                callback_data: JSON.stringify({
                    type: 'sendPost0balance',
                    data: messageId,
                })
            }],[{
                text: 'Отмена »',
                callback_data: JSON.stringify({
                    type: 'deleteMessege',
                })
            }],
        ]
    },
    getInlineLinkRefillBalance(url) {
        return [
            [ {
                text: '« Назад',
                callback_data: JSON.stringify({
                    type: 'backMyOffice',
                })
            },{
                text: 'Перейти к оплате »',
                url: url
            },
           ]
        ]
    },
    getInlineMyBalance() {
        return [
            [{
                text: 'Пополнить в BTC »',
                callback_data: JSON.stringify({
                    type: 'RefillBalance',
                })
            }],
            [{
                text: '« Назад',
                callback_data: JSON.stringify({
                    type: 'backMyOffice',
                })
            }]
        ]
    },
    getInlineLink() {
        return [
            [{
                text: 'Мой кабинет »',
                callback_data: JSON.stringify({
                    type: 'backMyOffice',
                })
            }],[{
                text: 'Магазин »',
                callback_data: JSON.stringify({
                    type: 'backSelType',
                })
            }],
        ]
    },

    getInlinePayProducts(product,price) {
        return [
            [{
                text: `💎 Купить 1шт. - ${price}$ »`,
                callback_data: JSON.stringify({
                    type: 'payProduct',
                    data: product.State,
                })
            }],[{
                text: '« Назад',
                callback_data: JSON.stringify({
                    type: 'backSelCity',
                    data: product.State
                })
            }],
        ]
    },

}
