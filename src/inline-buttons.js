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
    getInlineClearMyPurchases(Id) {
        return [
            [{
                text: 'Удалить (безвозвратно) »',
                callback_data: JSON.stringify({
                    type: 'ClearMyPurchases',
                    data:Id
                })
            }]
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
                    type: 'deleteMessage',
                })
            }],
        ]
    },
    getInlineLinkRefillBalance(url) {
        return [
            [ {
                text: '« Назад',
                callback_data: JSON.stringify({
                    type: 'myBalance',
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
                text: 'Пополнить в QIWI »',
                callback_data: JSON.stringify({
                    type: 'RefillBalanceQiwi',
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

    getInlinePayProducts(product,price,priceRub) {
        return [
            [{
                text: `💎 Купить 1шт. - ${price}$ (~${priceRub}₽) »`,
                callback_data: JSON.stringify({
                    type: `pPr${product.State}@#${product.City}@#${product.Type}`,
                })
            }],[{
                text: '« Назад',
                callback_data: JSON.stringify({
                    type: 'bSC',
                    data: `${product.State}@#${product.Type}`
                })
            }],
        ]
    },

}
