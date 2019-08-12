const TelegramBot = require('node-telegram-bot-api')
const config = require('./src/config')

const bot = new TelegramBot(config.TOKEN, {
    polling: true
})
const request = require('request');
var fs = require('fs');

var xlsx = require('node-xlsx');
const kb = require('./src/keyboard-buttons')
const ib = require('./src/inline-buttons')
const helper = require('./src/helper')
const keyboard = require('./src/keyboard')
const mongoose = require('mongoose')
const CronJob = require('cron').CronJob

const countState = 10
require('./models/user.model')
require('./models/type.model')
require('./models/state.model')
require('./models/city.model')
require('./models/product.model')
require('./models/tranz_info.model')

const Tranz_info = mongoose.model('Tranz_info')
const User = mongoose.model('User')
const Type = mongoose.model('Type')
const State = mongoose.model('State')
const City = mongoose.model('City')
const Product = mongoose.model('Product')

const adminChatIdVlad = 533605110 // Администрат1

const adminChatIdAndrey = 601990399 // Администрат2
const adminChatIdFullaInfo = 388510590 // Администрат3

const AdminArray = [adminChatIdVlad, adminChatIdAndrey, adminChatIdFullaInfo]

var Qiwi = require('node-qiwi-api').Qiwi;
var Wallet = new Qiwi(config.QIWITOKEN);


mongoose.Promise = global.Promise
mongoose.connect(config.DB_URL, {
        useMongoClient: true
    })
    .then(() => console.log('MongoDB connected!!!'))
    .catch((err) => console.log(err))


const privatKey = '344188e1bba3fdf5aeb7598aa34159ec7eb678f5a9f7c7919e796b68ab3687df'
const merchat = 'GJTPZzDgTkvmzpbzd2NEzackEtUuZTdcq4HDMt5uJrc2'
var BTCPAY_URL = 'https://btcpayjungle.com'

const btcpay = require('btcpay')
const keypair = btcpay.crypto.load_keypair(new Buffer.from(privatKey, 'hex'))

// Recreate client
const client = new btcpay.BTCPayClient(BTCPAY_URL, keypair, {
    merchant: merchat
})

// log(privatKey)
// var BTCPAY_URL='https://btcpayjungle.com'
// var BTCPAY_KEY= privatKey
// var BTCPAY_PAIRCODE= 'wCEbwLd'
// log(`[space] BTCPAY_URL=${BTCPAY_URL}/ BTCPAY_KEY=344188e1bba3fdf5aeb7598aa34159ec7eb678f5a9f7c7919e796b68ab3687df BTCPAY_PAIRCODE=${BTCPAY_PAIRCODE} node -e "const btcpay=require('btcpay'); new btcpay.BTCPayClient(process.env.BTCPAY_URL, btcpay.crypto.load_keypair(Buffer.from(process.env.BTCPAY_KEY, 'hex'))).pair_client(process.env.BTCPAY_PAIRCODE).then(console.log).catch(console.error)"`)

// // const btcpay = require('btcpay'); new btcpay.BTCPayClient(process.env.BTCPAY_URL, btcpay.crypto.load_keypair(Buffer.from(process.env.BTCPAY_KEY, 'hex'))).pair_client(process.env.BTCPAY_PAIRCODE).then(console.log).catch(console.error)


// BTCPAY_URL=https://btcpayjungle.com/ BTCPAY_KEY=344188e1bba3fdf5aeb7598aa34159ec7eb678f5a9f7c7919e796b68ab3687df BTCPAY_PAIRCODE=wCEbwLd node -e "const btcpay=require('btcpay'); new btcpay.BTCPayClient(process.env.BTCPAY_URL, btcpay.crypto.load_keypair(Buffer.from(process.env.BTCPAY_KEY, 'hex'))).pair_client(process.env.BTCPAY_PAIRCODE).then(console.log).catch(console.error)"




// BTCPAY_URL=https://mydomain.com/ BTCPAY_KEY=... BTCPAY_PAIRCODE=... node -e "const btcpay=require('btcpay'); new btcpay.BTCPayClient(process.env.BTCPAY_URL, btcpay.crypto.load_keypair(Buffer.from(process.env.BTCPAY_KEY, 'hex'))).pair_client(process.env.BTCPAY_PAIRCODE).then(console.log).catch(console.error)"


const publictime = new CronJob('*/1 * * * *', () => {
    Tranz_info.find({
        Active: true
    }).then(tranz_info => {
        if (tranz_info.length) {
            tranz_info.forEach(c => {
                client.get_invoice(c.InvoiceId)
                    .then(invoice => {
                        // log(invoice.status)
                        if (invoice && invoice.status === 'confirmed' || invoice.status === 'complete' || invoice.status === 'paid') {
                            Tranz_info.updateMany({
                                _id: c._id
                            }, {
                                $set: {
                                    Active: false,
                                }
                            }, function(err, res) {})

                            AdminArray.forEach(a=>{
                            bot.sendMessage(a, `<a href="tg://user?id=${chatId}">${c.Name}</a> пополнил свой баланс на ${c.Amount}$.`, {
                                parse_mode: 'html',
                            })
                            })

                            bot.sendMessage(c.telegramId, `Ваш баланс пополнен на ${c.Amount}$. Приятного пользования 😊)`, {
                                parse_mode: 'html',
                            })
                            User.findOne({
                                telegramId: c.telegramId
                            }).then(user => {
                                if (user) {
                                    User.updateMany({
                                        telegramId: c.telegramId
                                    }, {
                                        $set: {
                                            Balance: user.Balance + c.Amount,

                                        }
                                    }, function(err, res) {})
                                }
                            })
                        }
                        if (invoice && invoice.status === 'expired') {
                            Tranz_info.deleteOne(({
                                _id: c._id
                            }), function(err, result) {})
                        }
                    })
                    .catch(err => console.log('err'))
            })
        }
    })
})
publictime.start();

const publictimeqiwi = new CronJob('*/1 * * * *', () => {
    Wallet.getOperationHistory({
        rows: 10,
        operation: "IN"
    }, (err, operations) => {
        operations.data.forEach(c => {
            if (c.status === 'SUCCESS') {
                Tranz_info.findOne({
                    id: c.comment,
                    Active: true
                }).then(tranz_info => {
                    if (tranz_info) {
                                        log(c.total)

                    }
                    if (tranz_info && c.total.currency === 643) {

                        var chatId = tranz_info.telegramId
                            // AdminArray.forEach(a=>{
                            // bot.sendMessage(a, `<a href="tg://user?id=${chatId}">${c.Name}</a> пополнил свой баланс на ${parseFloat((c.total.amount/100)/63).toFixed(3)}$ через систему Qiwi.`, {
                            //     parse_mode: 'html',
                            // })
                            // })

                            bot.sendMessage(chatId, `Ваш баланс пополнен на ${parseFloat((c.total.amount/100)/63).toFixed(3)}$. Приятного пользования 😊)`, {
                                parse_mode: 'html',
                            })
                        User.findOne({telegramId:chatId}).then(user=>{
                                User.updateMany({
                                    telegramId: chatId
                                }, {
                                    $set: {
                                        Balance: user.Balance + parseFloat(c.total.amount/63).toFixed(3),
                                    }
                                }, function(err, res) {})

                                Tranz_info.updateMany({
                                    id: c.comment
                                }, {
                                    $set: {
                                        Active: false
                                    }
                                }, function(err, res) {})
                        })


                            }



                        }).catch(function(error) {}) 
                    
                
            }
        })
    })

})
publictimeqiwi.start();

bot.onText(/\/start (.+)/, (msg, [source, match]) => {
    velcomeText(msg)
})


bot.onText(/\/start/, msg => {
    velcomeText(msg)
    
})


bot.onText(/\/newpost/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            newPost(chatId)
        }
    })



})
function newPost(chatId) {
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: 'PostInput',
                }
            }, function(err, res) {})


            bot.sendMessage(chatId, `Отправьте, или перешлите боту, что вы хотите разослать подписчикам, либо вызовите команду /stop:`, {
                parse_mode: 'html',
                reply_markup: {
                    remove_keyboard: true,
                }

            })
}

bot.onText(/\/stop/, msg => {
    var chatId = msg.chat.id
    bot.sendMessage(chatId, 'Отменено!', {
        parse_mode: 'html',
        reply_markup: {
            resize_keyboard: true,
            keyboard: keyboard.Home
        }
    })
    User.updateMany({
        telegramId: chatId
    }, {
        $set: {
            Way: '',
            TempData: ''

        }
    }, function(err, res) {})


})

bot.onText(/\/newpricefullinfo/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Напишите новую цену, для товаров типа Full Info:', {
                parse_mode: 'html',
                reply_markup: {
                    remove_keyboard: true,
                }
            })
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: 'editPrice',
                    TempData: 'Full Info + SSN + DOB'

                }
            }, function(err, res) {})

        }
    })
})

bot.onText(/\/newfullinfo/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Для добавление товаров типа Full Info, пришлите боту документ, формата .xlsx', {
                parse_mode: 'html',
            })
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: 'addDocument',
                    TempData: 'Full Info + SSN + DOB'

                }
            }, function(err, res) {})

        }
    })
})

bot.onText(/\/newgooglevoice/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Для добавление товаров типа Google Voice, пришлите боту документ, формата .xlsx', {
                parse_mode: 'html',
            })
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: 'addDocument',
                    TempData: 'Google Voice'

                }
            }, function(err, res) {})
        }
    })
})

bot.onText(/\/newpricegooglevoice/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Напишите новую цену, для товаров типа Google Voice:', {
                parse_mode: 'html',
                reply_markup: {
                    remove_keyboard: true,
                }
            })
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: 'editPrice',
                    TempData: 'Google Voice'

                }
            }, function(err, res) {})
        }
    })
})



bot.on('message', msg => {
    var chatId = msg.chat.id
    User.findOne({
        telegramId: chatId,
    }).then(user => {
        if (user && msg.text !== '/stop' && msg.text !== '/start' && msg.text !== '/newgooglevoice' && msg.text !== '/newfullinfo' && msg.text !== '/pricefullinfo' && msg.text !== '/pricegooglevoice') {
            switch (user.Way) {
                case 'addDocument':
                    if (msg.document) {
                        try {
                            var documetId = msg.document.file_id;
                            bot.downloadFile(documetId, "./documents").then(function(path) {
                                console.log(path);
                                var obj = xlsx.parse(fs.readFileSync(`${__dirname}/${path}`))
                                var obj2 = obj[0].data
                                var arrState = []
                                var arrcity = []
                                var typevar = user.TempData

                                if (obj2.length < 10000) {
                                    for (var i = obj2.length - 1; i >= 1; i--) {
                                        switch (user.TempData) {
                                            case 'Google Voice':
                                                var statevar = `${obj2[i][3]}`
                                                var re = `${obj2[i][4]}`
                                                re = re.split(')')
                                                var cityvar = `${re[0]})`
                                                log(cityvar)
                                                var desc = `${obj2[i][0]}|pass:${obj2[i][1]}|security answer:${obj2[i][2]}|${obj2[i][3]}|${obj2[i][4]}`
                                                break
                                            case 'Full Info + SSN + DOB':
                                                var statevar = `${obj2[i][3]}`
                                                var cityvar = `${obj2[i][2]}`
                                                var desc = `${obj2[i][0]}|${obj2[i][1]}|${obj2[i][2]}|${obj2[i][3]}|${obj2[i][4]}|${obj2[i][5]}|${obj2[i][6]}-${obj2[i][7]}-${obj2[i][8]}`
                                                break
                                        }
                                        arrState.push(statevar)
                                        arrcity.push([statevar, cityvar])
                                        new Product({
                                            Name: typevar,
                                            State: statevar,
                                            City: cityvar,
                                            Type: typevar,
                                            Description: `${desc}`
                                        }).save().then(newprod => {
                                            if (newprod) {
                                                Product.updateMany({
                                                    _id: newprod._id
                                                }, {
                                                    $set: {
                                                        id: newprod._id
                                                    }
                                                }, function(err, res) {})
                                            }
                                        }).catch(e => console.log(e))
                                    }

                                }
                                bot.sendMessage(chatId, 'Новые товары успешно добавлены в базу!', {
                                    parse_mode: 'html',
                                })
                                User.updateMany({
                                    telegramId: chatId
                                }, {
                                    $set: {
                                        Way: '',
                                        TempData: ''

                                    }
                                }, function(err, res) {})
                                var arrStateNew = unique(arrState)
                                var arrcityNew = unique(arrcity)

                                arrStateNew.forEach(i => {
                                    State.find({
                                        Name: i
                                    }).then(state => {
                                        if (!state.length) {
                                            new State({
                                                Name: i,
                                                Type: typevar,
                                            }).save().then(newstate => {
                                                if (newstate) {
                                                    State.updateMany({
                                                        _id: newstate._id
                                                    }, {
                                                        $set: {
                                                            id: newstate._id
                                                        }
                                                    }, function(err, res) {})
                                                }
                                            })
                                        }
                                    })
                                })


                                arrcityNew.forEach(i => {
                                    var is = i.split(',')
                                    City.find({
                                        State: is[0],
                                        Name: is[1]
                                    }).then(city => {
                                        if (!city.length) {
                                            new City({
                                                Name: is[1],
                                                State: is[0],
                                                Type: typevar,
                                            }).save().then(newcity => {
                                                if (newcity) {
                                                    City.updateMany({
                                                        _id: newcity._id
                                                    }, {
                                                        $set: {
                                                            id: newcity._id
                                                        }
                                                    }, function(err, res) {})
                                                }
                                            })
                                        }

                                    })

                                })

                            });
                        } catch (err) {
                            bot.sendMessage(chatId, 'Произошла ошибка, проверьте правильность данных!', {
                                parse_mode: 'html',
                            })

                        }
                    } else {
                        bot.sendMessage(chatId, 'Для добавление товаров типа Full Info, пришлите боту документ, формата .xlsx, либо вызовите команду /stop', {
                            parse_mode: 'html',
                        })
                    }
                    break;
                case 'editPrice':
                    if (parseFloat(msg.text) * 0 === 0 && parseFloat(msg.text) > 0) {
                        User.updateMany({
                            telegramId: chatId
                        }, {
                            $set: {
                                Way: '',
                                TempData: ''

                            }
                        }, function(err, res) {})
                        bot.sendMessage(chatId, `Вы изменили цену на товар типа ${user.TempData}. Актуальная цена ${parseFloat(msg.text)}`, {
                            parse_mode: 'html',
                        })
                        Type.findOne({
                            Name: user.TempData
                        }).then(type => {
                            Type.updateMany({
                                _id: type._id
                            }, {
                                $set: {
                                    Price: parseFloat(msg.text)
                                }
                            }, function(err, res) {})
                        })
                    } else {
                        bot.sendMessage(chatId, `Напишите новую цену для товаров типа ${user.TempData}, либо вызовите команду /stop`, {
                            parse_mode: 'html',
                            reply_markup: {
                                remove_keyboard: true,
                            }
                        })
                    }
                    break
                case 'inputRefillBalance':
                    if (parseFloat(msg.text) * 0 === 0 && parseFloat(msg.text) > 0) {
                        request('https://api.cryptonator.com/api/ticker/btc-usd', function(error, response, body) {
                            const data = JSON.parse(body)
                            User.updateMany({
                                telegramId: chatId
                            }, {
                                $set: {
                                    Way: ''
                                }
                            }, function(err, res) {})

                            client.create_invoice({
                                    price: parseFloat(msg.text),
                                    currency: 'USD'
                                })
                                .then(invoice => {
                                    new Tranz_info({
                                        Name: msg.from.first_name,
                                        telegramId: chatId,
                                        Active: true,
                                        url: invoice.url,
                                        InvoiceId: invoice.id,
                                        Amount: parseFloat(msg.text).toFixed(3)
                                    }).save().then(newstate => {
                                        if (newstate) {
                                            Tranz_info.updateMany({
                                                _id: newstate._id
                                            }, {
                                                $set: {
                                                    id: newstate._id
                                                }
                                            }, function(err, res) {})
                                        }
                                    })


                                    bot.sendMessage(chatId, `Хорошо, почти готово! Теперь генерирую счет ..`, {
                                        reply_markup: {
                                            resize_keyboard: true,
                                            keyboard: keyboard.Home
                                        }
                                    }).then(send => {
                                        bot.sendMessage(chatId, `📈 Курс BTC ➖ <b>$${data.ticker.price}.</b>

🥈<b>Платеж начисляется после двух подтверждений.</b> 

📲 Для пополнения баланса на сумму <b>${msg.text}$</b> нажмите кнопку ниже.
<i>- После оплаты и подтверждения, бот автоматически пришлет уведомление.</i>`, {
                                            parse_mode: 'html',
                                            reply_markup: {
                                                inline_keyboard: ib.getInlineLinkRefillBalance(invoice.url)
                                            }
                                        })
                                    })

                                })
                                .catch(err => console.log(err))
                        })
                    } else {
                        bot.sendMessage(chatId, `Напишите сумму в $ для пополнения, либо вызовите команду /stop`, {
                            parse_mode: 'html',
                            reply_markup: {
                                remove_keyboard: true,
                            }
                        })
                    }
            case 'PostInput':
                if (msg.text.slice(0, 1) !== '/' && msg.text !== '/start' && msg.text !== '/newpost') {
                                    bot.sendMessage(chatId, `Отлично.`, {
                                        reply_markup: {
                                            resize_keyboard: true,
                                            keyboard: keyboard.Home
                                        }
                                    })                    
                                        bot.sendMessage(chatId, `Выберите Категорию, которой делать рассылку:`, {
                                            parse_mode: 'html',
                                            reply_to_message_id: msg.message_id,
                                            reply_markup: {
                                                inline_keyboard: ib.getInlineListForPost(msg.message_id)
                                            }
                                        })

                            User.updateMany({
                                telegramId: chatId
                            }, {
                                $set: {
                                    Way: ' ',
                                }
                            }, function(err, res) {})
                        

                }
                break;

                    break
                default:
                    switch (msg.text) {
                        case kb.Home.MyOffice:
                            getInlineMyOffice(chatId, false)
                            break
                        case kb.Home.Link:
                            bot.sendMessage(chatId, '<b>Магазин / Поддержка</b>\n\nДля поддержки свяжитесь с @Andrew_Full в секретном чате!', {
                                parse_mode: 'html',
                                reply_markup: {
                                    inline_keyboard: ib.getInlineLink()
                                }
                            })
                            break
                        case kb.Home.Products:
                            selType(chatId)
                            break

                    }
            }
        }
    })


})

function unique(arr) {
    var obj = {};

    for (var i = 0; i < arr.length; i++) {
        var str = arr[i];
        obj[str] = true; // запомнить строку в виде свойства объекта
    }

    return Object.keys(obj); // или собрать ключи перебором для IE8-
}



bot.on('callback_query', query => {
    log(query)
    var chatId = query.from.id
    var messageId = query.message.message_id
    const {
        type,
        data,
        temp
    } = JSON.parse(query.data)

    switch (type) {
        case 'sendPostall':
            bot.answerCallbackQuery({
                callback_query_id: query.id,
                text: `✔️ Ваше сообщение отправлено всем подписчикам.`,
                show_alert: true
            })
            User.find({}).then(users=>{
                if (users.length) {
                    users.forEach(c => {
                        bot.forwardMessage(c.telegramId, chatId, data)
                    })
                }
            })

            break
        case 'sendPost0balance':
            bot.answerCallbackQuery({
                callback_query_id: query.id,
                text: `✔️ Ваше сообщение отправлено подписчикам, у которых баланс 0$.`,
                show_alert: true
            })
            User.find({}).then(users=>{
                users.forEach(c => {
                        if (c.Balance === 0) {
                            bot.forwardMessage(c.telegramId, chatId, data)
                        } 
                    
                })
            })
            break

        case 'deleteMessage':
            bot.deleteMessage(chatId, messageId)
            break

        case 'SelState':
            sendCity(chatId, messageId, query, data, 0)
            break
        case 'payProduct':
            Promise.all([
                User.findOne({
                    telegramId: chatId
                }),
                Product.findOne({
                    telegramId: 'false',
                    State: data
                })
            ]).then(([user, product]) => {
                if (product) {
                    Type.findOne({
                        Name: product.Type
                    }).then(type => {
                        if (user.Balance >= type.Price) {
                            AdminArray.forEach(c=>{
                            bot.sendMessage(c, `<a href="tg://user?id=${chatId}">${query.from.first_name}</a> совершил покупку товара ${product.Name}.`, {
                                parse_mode: 'html',
                                reply_markup: {
                                    inline_keyboard: ib.getInlineLink()
                                }
                            })
                            })
                            bot.editMessageText(`➡️ <b>Сделка прошла успешно!</b> Списание средств со счета <b>-${type.Price}$</b>. Ваш баланс: <b>${user.Balance - type.Price}$</b>.\n Хорошего дня!`, {
                                chat_id: chatId,
                                message_id: messageId,
                                parse_mode: 'html',
                                disable_web_page_preview: true,
                                reply_markup: {
                                    inline_keyboard: ib.getInlineLink()
                                }

                            }).then(function(resp) {}).catch(function(error) {})

                            sendMyPurchases(chatId, [product])
                            Product.updateMany({
                                id: product.id
                            }, {
                                $set: {
                                    telegramId: chatId
                                }
                            }, function(err, res) {})
                            User.updateMany({
                                telegramId: chatId
                            }, {
                                $set: {
                                    Balance: user.Balance - type.Price
                                }
                            }, function(err, res) {})
                        } else {
                            myBalance(chatId, messageId)
                            bot.answerCallbackQuery({
                                callback_query_id: query.id,
                                show_alert: true,
                                text: `💤 Недостаточно средств на счету. Пополните счет, перейдя в меню "Мой кабинет"`
                            })
                        }
                    })
                } else {
                    bot.deleteMessage(chatId, messageId)
                    bot.answerCallbackQuery({
                        callback_query_id: query.id,
                        show_alert: true,
                        text: `💤 Произошла ошибка. Данный продукт был продан. Выберите другой`
                    })
                }
            })
            break
        case 'SelType':
            sendState(chatId, messageId, query, data, 0, query)
            break
        case 'nextState':
            sendState(chatId, messageId, query, data, temp, query)
            break
        case 'nextCity':
            sendCity(chatId, messageId, query, data, temp)
            break
        case 'backCity':
            var lst = ((temp - countState * 2) < 0) ? 10000 : temp - countState * 2
            sendCity(chatId, messageId, query, data, lst)
            break
        case 'backState':
            var lst = ((temp - countState * 2) < 0) ? 10000 : temp - countState * 2
            sendState(chatId, messageId, query, data, lst, query)
            break
        case 'RefillBalance':
            bot.sendMessage(chatId, `Напишите сумму в $ для пополнения, либо вызовите команду /stop`, {
                parse_mode: 'html',
                reply_markup: {
                    remove_keyboard: true,
                }
            })
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: 'inputRefillBalance'
                }
            }, function(err, res) {})
            break
        case 'backMyOffice':
            getInlineMyOffice(chatId, true, messageId)
            break
        case 'RefillBalanceQiwi':
            Tranz_info.findOne({telegramId:chatId}).then(tranz_info=>{
                var text = `📲 Ваша персональная ссылка для пополнения через систему QIWI. \n📝 Пополните счет на любою сумму, не изменяя комментарий, и дождитесь оповещения от бота.`
                if (tranz_info) {
                                    new Tranz_info({
                                        Name: query.from.first_name,
                                        telegramId: chatId,
                                        Active: true,
                                    }).save().then(newtranzinfo => {
                                        if (newtranzinfo) {
                                            Tranz_info.updateMany({
                                                _id: newtranzinfo._id
                                            }, {
                                                $set: {
                                                    id: newtranzinfo._id
                                                }
                                            }, function(err, res) {})
                                        }
                                                    
                                    var qiwiurl = `https://w.qiwi.com/payment/form/99?currency=643&amountFraction=0&extra[%27account%27]=${config.QIWIPORTMONEY}&extra[%27comment%27]=${newtranzinfo._id}`
                bot.sendMessage(chatId, text, {
                    parse_mode: 'html',
                    reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: 'Перейти к оплате »',
                                    url: qiwiurl
                                }],    
                                 ]   }            
                    
                })
            })
                }else{

                var qiwiurl = `https://w.qiwi.com/payment/form/99?currency=643&amountFraction=0&extra[%27account%27]=${config.QIWIPORTMONEY}&extra[%27comment%27]=${tranz_info._id}`
                bot.sendMessage(chatId,text , {
                    parse_mode: 'html',
                    reply_markup: {
                            inline_keyboard: [
                                [{
                                    text: 'Перейти к оплате »',
                                    url: qiwiurl
                                }],    
                                 ]   }            
            })
                }
            })
            break
        case 'backSelCity':
            sendCity(chatId, messageId, query, data, 0)
            break
        case 'backSelState':
            sendState(chatId, messageId, query, data, 0, query)
            break
        case 'SelCity':
            sendViewProduct(chatId, messageId, query, data)
            break
        case 'backSelType':
            selType(chatId, true, messageId)
            break
        case 'MyPurchases':
            Product.find({
                telegramId: chatId
            }).then(products => {
                if (products.length) {
                    sendMyPurchases(chatId, products)
                } else {
                    bot.answerCallbackQuery({
                        callback_query_id: query.id,
                        show_alert: true,
                        text: `💤 Вы не совершали ни одной покупки.`
                    })
                }
            })
            break
        case 'myBalance':
            myBalance(chatId, messageId)
            break;
        case 'MyPurchases':

            break;
    }


})

function myBalance(chatId, messageId) {
    User.findOne({
        telegramId: chatId
    }).then(user => {
        if (user) {
            bot.editMessageText(`➡️ <b>Твой баланс: ${user.Balance}$</b>\n\n- Для того чтобы пополнить баланс, выбери соответствующее меню:`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'html',
                disable_web_page_preview: true,
                reply_markup: {
                    inline_keyboard: ib.getInlineMyBalance()
                }

            }).then(function(resp) {}).catch(function(error) {})
        }
    })
}

function sendState(chatId, messageId, query, data, temp, query) {

    Promise.all([
        State.find({
            Type: data
        }).skip(temp).limit(countState).sort({
            Name: 1
        }),
        Type.findOne({
            Name: data
        })
    ]).then(([states, type]) => {
        if (states.length) {
            getInlineListStates(chatId, messageId, states, type.Name, temp + countState)
        } else {
            log('fdg')
            bot.answerCallbackQuery({
                callback_query_id: query.id,
                show_alert: true,
                text: `💤 По Вашему запросу нечего не найдено! Повторите попытку позже. `
            })
        }
    })

}

function getInlineMyOffice(chatId, edit, messageId) {
    var text = '🏠 Ты вошел в личный кабинет:'
    if (edit) {
        bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'html',
            reply_markup: {
                inline_keyboard: ib.getInlineMyOffice()
            }

        }).then(function(resp) {}).catch(function(error) {})
    } else {
        bot.sendMessage(chatId, text, {
            parse_mode: 'html',
            reply_markup: {
                inline_keyboard: ib.getInlineMyOffice()
            }
        })
    }

}

function velcomeText(msg) {
    var chatId = msg.from.id
    User.findOne({
        telegramId: chatId
    }).then(users => {
        if (!users) {
            new User({
                telegramId: chatId,
                Name: msg.from.first_name,
            }).save()
            AdminArray.forEach(c => {
                bot.sendMessage(c, `<a href="tg://user?id=${chatId}">${msg.from.first_name}</a> _ /id${chatId} _ присоединился(ась) к боту!`, {
                    parse_mode: 'html',
                })
            })
        }

    })
    bot.sendMessage(chatId, `Привет, <b>${msg.from.first_name}</b>! Я бот магазина «Google Voice + Full info». Я умею принимать твои заказы, сообщать о скидках и акциях.  Подписывайся!
Продажа учётных записей Full info и Google Voice по низким ценам.`, {
        parse_mode: 'html',
        reply_markup: {
            resize_keyboard: true,
            keyboard: keyboard.Home
        }
    })
}


function selType(chatId, edit, messageId) {
    Type.find({}).then(types => {
        if (types.length) {
            getInlineListType(chatId, messageId, types, edit)
        } else {
            bot.sendMessage(chatId, 'По Вашему запросу нечего не найдено! Повторите попытку позже.', {
                parse_mode: 'html',
                reply_markup: {
                    inline_keyboard: ib.getInlineLink()
                }
            })
        }
    })




}

function sendCity(chatId, messageId, query, data, temp) {
    Promise.all([
        City.find({
            State: data
        }).skip(temp).limit(countState).sort({
            Name: 1
        }),
        State.findOne({
            Name: data
        }),
    ]).then(([citys, state]) => {
        if (citys.length) {
            Type.findOne({
                Name: state.Type
            }).then(type => {
                getInlineListCitys(chatId, messageId, citys, type.Name, state.Name, temp + countState, query)
            })
        } else {
            bot.answerCallbackQuery({
                callback_query_id: query.id,
                show_alert: true,
                text: `💤 По Вашему запросу нечего не найдено! Повторите попытку позже. `
            })
        }
    })

}

async function getInlineListCitys(chatId, messageId, citys, typeName, stateName, last, query) {
    const cityNames = citys.map(citys => citys.Name);
    const allProducts = await Product.find({
        City: {
            $in: cityNames
        },
        telegramId: 'false'
    });


    var arr = []
    var i = 0
    var ic = 0

    citys.forEach(c => {
        const count =
            allProducts.filter(product => product.City === c.Name)
            .length ||
            0;
        if (count > 0) {
            if (ic % 2 === 0) {
                arr.push(
                    [{
                        text: `${c.Name} | ${count} »`,
                        callback_data: JSON.stringify({
                            type: 'SelCity',
                            data: c.Name
                        })
                    }],
                )
                i++

            } else {
                arr[i - 1].push({
                    text: `${c.Name} | ${count} »`,
                    callback_data: JSON.stringify({
                        type: 'SelCity',
                        data: c.Name,
                    })
                })
            }
            ic++
        } else {
            return 0
        }
    })
    if (arr.length) {
        arr.push(
            [{
                    text: `« Назад`,
                    callback_data: JSON.stringify({
                        type: 'backSelState',
                        data: citys[0].Type,
                    })
                }, {
                    text: `«`,
                    callback_data: JSON.stringify({
                        type: 'backCity',
                        data: citys[0].State,
                        temp: last,
                    })
                },
                {
                    text: `»`,
                    callback_data: JSON.stringify({
                        type: 'nextCity',
                        data: citys[0].State,
                        temp: last,
                    })
                }
            ],
        )
        var txt = citys[0].Type === 'Google Voice' ? 'код телефона' : 'город'

        bot.editMessageText(`Ваши данные:\n- <b>Тип:</b> ${typeName}.\n- <b>Штат:</b> ${stateName}.\nТеперь выберите, интересующий Вас ${txt}:`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'html',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: arr
            }

        }).then(function(resp) {}).catch(function(error) {})
    } else {
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            show_alert: true,
            text: `💤 По Вашему запросу нечего не найдено! Повторите попытку позже. `
        })
    }
}




function sendViewProduct(chatId, messageId, query, data) {
    Product.find({
        City: data,
        telegramId: 'false'
    }).then(products => {

        Product.findOne({
            City: data,
            telegramId: 'false'
        }).then(product => {
            if (product) {
                Promise.all([
                    State.findOne({
                        Name: product.State
                    }),
                    City.findOne({
                        Name: product.City
                    }),
                    Type.findOne({
                        Name: product.Type
                    })
                ]).then(([state, city, type]) => {

                    var txt = product.Name === 'Google Voice' ? 'Код телефона' : 'город'

                    bot.editMessageText(`🛍 Вы заполнили необходимые данные!\n___\n- <b>Название:</b>  ${product.Name}.\n- <b>Штат:</b> ${state.Name}.\n- <b>${txt}:</b> ${city.Name}.\n- <b>Доступно:</b> ${products.length}шт.\n\n<i>После покупки, бот мгновенно пришлет вам данные, согласно запросу!</i>`, {
                        chat_id: chatId,
                        message_id: messageId,
                        parse_mode: 'html',
                        disable_web_page_preview: true,
                        reply_markup: {
                            inline_keyboard: ib.getInlinePayProducts(product, type.Price)
                        }


                    }).then(function(resp) {}).catch(function(error) {})
                })
            } else {
                bot.answerCallbackQuery({
                    callback_query_id: query.id,
                    show_alert: true,
                    text: `💤 По Вашему запросу нечего не найдено! Повторите попытку позже. `
                })
            }
        })
    })
}

function log(k) {
    console.log(k)
}

function sendMyPurchases(chatId, products) {
    products.forEach(c => {
        Type.findOne({
            Name: c.Type
        }).then(type => {
            if (type) {
                bot.sendMessage(chatId, `💎 <b>Название:</b> ${type.Name}.\n📝 <b>Данные:</b> ${c.Description}.`, {
                    parse_mode: 'html',
                })
            }
        })
    })
}



async function getInlineListStates(chatId, messageId, states, typeName, last, query) {
    const statesNames = states.map(state => state.Name);
    const allProducts = await Product.find({
        State: {
            $in: statesNames
        },
        telegramId: 'false'
    });

    var arr = []
    var i = 0
    var ic = 0

    statesNames.forEach(c => {
        const count =
            allProducts.filter(product => product.State === c)
            .length ||
            0;
        if (count > 0) {
            if (ic % 2 === 0) {
                arr.push(
                    [{
                        text: `${c} | ${count} »`,
                        callback_data: JSON.stringify({
                            type: 'SelState',
                            data: c
                        })
                    }],
                )
                i++

            } else {
                arr[i - 1].push({
                    text: `${c} | ${count} »`,
                    callback_data: JSON.stringify({
                        type: 'SelState',
                        data: c
                    })
                })
            }
            ic++
        } else {
            return 0
        }
    })
    if (arr.length) {
        arr.push(
            [{
                    text: `« Назад`,
                    callback_data: JSON.stringify({
                        type: 'backSelType',
                    })
                }, {
                    text: `«`,
                    callback_data: JSON.stringify({
                        type: 'backState',
                        data: states[0].Type,
                        temp: last,
                    })
                },
                {
                    text: `»`,
                    callback_data: JSON.stringify({
                        type: 'nextState',
                        data: states[0].Type,
                        temp: last,
                    })
                }
            ],
        )

        bot.editMessageText(`Ваши данные:\n- <b>Тип:</b> ${typeName}.\nТеперь выберите, интересующий Вас штат:`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'html',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: arr
            }

        }).then(function(resp) {}).catch(function(error) {})
    } else {
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            show_alert: true,
            text: `💤 По Вашему запросу нечего не найдено! Повторите попытку позже. `
        })
    }

}




async function getInlineListType(chatId, messageId, types, edit) {
    var arr = []
    const typesNames = types.map(types => types.Name);
    log(typesNames)
    const allProducts = await Product.find({
        Type: {
            $in: typesNames
        },
        telegramId: 'false'
    });


    types.forEach(c => {

        const count =
            allProducts.filter(product => product.Type === c.Name)
            .length ||
            0;

        if (count > 0) {

            arr.push(
                [{
                    text: `${c.Name} - ${c.Price}$ | ${count} »`,
                    callback_data: JSON.stringify({
                        type: 'SelType',
                        data: c.Name
                    })
                }],
            )
        } else {
            return 0
        }
    })

    if (arr.length) {
        var text = '🛒 <b>Вы вошли в магазин.</b>\n- Выберите тип данных, который Вас интересует:'
    } else {
        var text = 'Нечего не найдено по вашему запросу. Повторите попытку позже!'
    }

    if (edit) {
        bot.editMessageText(text, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'html',
            reply_markup: {
                inline_keyboard: arr
            }

        }).then(function(resp) {}).catch(function(error) {})
    } else {
        bot.sendMessage(chatId, text, {
            parse_mode: 'html',
            reply_markup: {
                inline_keyboard: arr

            }
        })
    }


}
