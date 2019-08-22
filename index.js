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




const options = {
    key: `1161485cc5c3e2748bccc8821520c70890d9e5cbc88777b4c9633cf2f58933b3`,
    secret: `dc60786E2De91d87A868aFFbC5FaDbe3a0ce6665c407721452358FE30a860D01`,
}

const Coinpayments = require("coinpayments");
const clientcoinpayments = new Coinpayments(options);

const publictime = new CronJob('*/1 * * * *', () => {
    Tranz_info.find({
        Active: true
    }).then(tranz_info => {
        if (tranz_info.length) {
            tranz_info.forEach(c => {
                if (c.InvoiceId) {
                    clientcoinpayments.getTx({
                        txid: c.InvoiceId
                    }).then(invoices => {
                        if (invoices && invoices.status === 100 || invoices && invoices.status_text === 'Waiting for confirms...') {
                            request('https://api.cryptonator.com/api/ticker/btc-usd', function(error, response, body) {
                                const data = JSON.parse(body)
                                var pr = parseFloat(data.ticker.price)
                                var am = parseFloat(invoices.amountf)
                                var summ = pr * am


                                Tranz_info.updateMany({
                                    _id: c._id
                                }, {
                                    $set: {
                                        Active: false,
                                    }
                                }, function(err, res) {})

                                AdminArray.forEach(a => {
                                    bot.sendMessage(a, `<a href="tg://user?id=${c.telegramId}">${c.Name}</a> пополнил свой баланс на ${summ.toFixed(2)}$.`, {
                                        parse_mode: 'html',
                                    })
                                })

                                bot.sendMessage(c.telegramId, `Ваш баланс пополнен на ${summ.toFixed(2)}$. Приятного пользования 😊)`, {
                                    parse_mode: 'html',
                                })
                                User.findOne({
                                    telegramId: c.telegramId
                                }).then(user => {
                                    if (user) {

                                        var iii = parseFloat(user.Balance) + parseFloat(summ)
                                        User.updateMany({
                                            telegramId: c.telegramId
                                        }, {
                                            $set: {
                                                Balance: (iii).toFixed(2),

                                            }
                                        }, function(err, res) {})
                                    }
                                })
                            })


                        }
                        if (invoices && invoices.status === -100) {
                            Tranz_info.deleteOne(({
                                _id: c._id
                            }), function(err, result) {})
                        }
                    }).catch();
                }


                // client.get_invoice(c.InvoiceId)
                //     .then(invoice => {
                //         // log(invoice.status)
                //         if (invoice && invoice.status === 'confirmed' || invoice.status === 'complete' || invoice.status === 'paid') {
                //             Tranz_info.updateMany({
                //                 _id: c._id
                //             }, {
                //                 $set: {
                //                     Active: false,
                //                 }
                //             }, function(err, res) {})

                //             AdminArray.forEach(a=>{
                //             bot.sendMessage(a, `<a href="tg://user?id=${chatId}">${c.Name}</a> пополнил свой баланс на ${c.Amount}$.`, {
                //                 parse_mode: 'html',
                //             })
                //             })

                //             bot.sendMessage(c.telegramId, `Ваш баланс пополнен на ${c.Amount}$. Приятного пользования 😊)`, {
                //                 parse_mode: 'html',
                //             })
                //             User.findOne({
                //                 telegramId: c.telegramId
                //             }).then(user => {
                //                 if (user) {
                //                     User.updateMany({
                //                         telegramId: c.telegramId
                //                     }, {
                //                         $set: {
                //                             Balance: user.Balance + c.Amount,

                //                         }
                //                     }, function(err, res) {})
                //                 }
                //             })
                //         }
                //         if (invoice && invoice.status === 'expired') {
                //             Tranz_info.deleteOne(({
                //                 _id: c._id
                //             }), function(err, result) {})
                //         }
                //     })
                //     .catch(err => console.log('err'))
            })
        }
    })
})
publictime.start();
// 
const publictimeqiwi = new CronJob('*/1 * * * *', () => {
    Wallet.getOperationHistory({
        rows: 5,
        operation: "IN"
    }, (err, operations) => {
        operations.data.forEach(c => {
            if (c.status === 'SUCCESS') {
                Tranz_info.findOne({
                    id: c.comment,
                    Active: true
                }).then(tranz_info => {
                    if (tranz_info && c.total.currency === 643) {

                        request('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5', function(error, response, body) {
                            if (error) throw new Error(error)
                            if (response.statusCode === 200) {
                                const data = JSON.parse(body);
                                const resultrur = data.filter(item => item.ccy === 'RUR')[0];
                                const resultusd = data.filter(item => item.ccy === 'USD')[0];

                                var result = (1 * resultusd.sale) * (1 / resultrur.sale)

                                var chatId = tranz_info.telegramId
                                User.findOne({
                                    telegramId: chatId
                                }).then(user => {
                                    var bal = user.Balance
                                    var am = c.total.amount / result
                                    var resul = (bal + am).toFixed(2)

                                    AdminArray.forEach(a => {
                                        bot.sendMessage(a, `<a href="tg://user?id=${chatId}">${tranz_info.Name}</a> пополнил свой баланс на ${am.toFixed(2)}$ (${c.total.amount}₽) через систему Qiwi.`, {
                                            parse_mode: 'html',
                                        })
                                    })


                                    bot.sendMessage(chatId, `Ваш баланс пополнен на ${am.toFixed(2)}$ (${c.total.amount}₽). Приятного пользования 😊)`, {
                                        parse_mode: 'html',
                                    })


                                    User.updateMany({
                                        telegramId: chatId
                                    }, {
                                        $set: {
                                            Balance: resul,
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
            bot.sendMessage(chatId, 'Напишите новую цену, для товаров типа Full Info + SSN + DOB:', {
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

bot.onText(/\/newpricefullinfocs600/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Напишите новую цену, для товаров типа Full Info + SSN + DOB + CS(600-700):', {
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
                    TempData: 'Full Info + SSN + DOB + CS(600-700)'

                }
            }, function(err, res) {})

        }
    })
})

bot.onText(/\/newpricefullinfocs700/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Напишите новую цену, для товаров типа Full Info + SSN + DOB + CS(700-800):', {
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
                    TempData: 'Full Info + SSN + DOB + CS(700-800)'

                }
            }, function(err, res) {})

        }
    })
})

bot.onText(/\/newpricefullinfocs800/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Напишите новую цену, для товаров типа Full Info + SSN + DOB + CS(800+):', {
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
                    TempData: 'Full Info + SSN + DOB + CS(800+)'

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

bot.onText(/\/newfullinfocs600/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Для добавление товаров типа Full Info + SSN + DOB + CS(600-700), пришлите боту документ, формата .xlsx', {
                parse_mode: 'html',
            })
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: 'addDocument',
                    TempData: 'Full Info + SSN + DOB + CS(600-700)'

                }
            }, function(err, res) {})

        }
    })
})

bot.onText(/\/newfullinfocs700/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Для добавление товаров типа Full Info + SSN + DOB + CS(700-800), пришлите боту документ, формата .xlsx', {
                parse_mode: 'html',
            })
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: 'addDocument',
                    TempData: 'Full Info + SSN + DOB + CS(700-800)'

                }
            }, function(err, res) {})

        }
    })
})

bot.onText(/\/newfullinfocs800/, msg => {
    var chatId = msg.chat.id
    AdminArray.forEach(c => {
        if (c === chatId) {
            bot.sendMessage(chatId, 'Для добавление товаров типа Full Info + SSN + DOB + CS(800+), пришлите боту документ, формата .xlsx', {
                parse_mode: 'html',
            })
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: 'addDocument',
                    TempData: 'Full Info + SSN + DOB + CS(800+)'

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




bot.on('message', msg => {
    var chatId = msg.chat.id
    // new Type({
    //     Name: 'Full Info + SSN + DOB + CS(800+)',
    //     Sort: 'd',
    //     Price: 10,
    // }).save().then(newtranzinfo => {
    //     if (newtranzinfo) {
    //         Type.updateMany({
    //             _id: newtranzinfo._id
    //         }, {
    //             $set: {
    //                 id: newtranzinfo._id
    //             }
    //         }, function(err, res) {})
    //     }})

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
                                                var desc = `${obj2[i][0]}|pass:${obj2[i][1]}|security answer:${obj2[i][2]}|${obj2[i][3]}|${obj2[i][4]}`
                                                break
                                            case 'Full Info + SSN + DOB':
                                                var statevar = `${obj2[i][3]}`
                                                var cityvar = `${obj2[i][2]}`
                                                var desc = `${obj2[i][0]}|${obj2[i][1]}|${obj2[i][2]}|${obj2[i][3]}|${obj2[i][4]}|${obj2[i][5]}|${obj2[i][6]}-${obj2[i][7]}-${obj2[i][8]}`
                                                break
                                            case 'Full Info + SSN + DOB + CS(600-700)':
                                                var statevar = `${obj2[i][3]}`
                                                var cityvar = `${obj2[i][2]}`
                                                var desc = `${obj2[i][0]}|${obj2[i][1]}|${obj2[i][2]}|${obj2[i][3]}|${obj2[i][4]}|${obj2[i][5]}|${obj2[i][6]}-${obj2[i][7]}-${obj2[i][8]}|${obj2[i][9]}`
                                                break
                                            case 'Full Info + SSN + DOB + CS(700-800)':
                                                var statevar = `${obj2[i][3]}`
                                                var cityvar = `${obj2[i][2]}`
                                                var desc = `${obj2[i][0]}|${obj2[i][1]}|${obj2[i][2]}|${obj2[i][3]}|${obj2[i][4]}|${obj2[i][5]}|${obj2[i][6]}-${obj2[i][7]}-${obj2[i][8]}|${obj2[i][9]}`
                                                break
                                            case 'Full Info + SSN + DOB + CS(800+)':
                                                var statevar = `${obj2[i][3]}`
                                                var cityvar = `${obj2[i][2]}`
                                                var desc = `${obj2[i][0]}|${obj2[i][1]}|${obj2[i][2]}|${obj2[i][3]}|${obj2[i][4]}|${obj2[i][5]}|${obj2[i][6]}-${obj2[i][7]}-${obj2[i][8]}|${obj2[i][9]}`
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
                                        Name: i,
                                        Type:typevar
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
                                        Type:typevar,
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
                            clientcoinpayments.createTransaction({
                                    'currency1': 'USD',
                                    'currency2': 'BTC',
                                    'amount': parseFloat(msg.text).toFixed(3),
                                    'buyer_email': 'full_voice_bot@gmail.com'
                                })
                                .then(invoice => {
                                    new Tranz_info({
                                        Name: msg.from.first_name,
                                        telegramId: chatId,
                                        Active: true,
                                        url: invoice.checkout_url,
                                        InvoiceId: invoice.txn_id,
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
                                    }).catch();




                                    // client.create_invoice({
                                    //         price: parseFloat(msg.text),
                                    //         currency: 'USD'
                                    //     })
                                    //     .then(invoice => {
                                    //         new Tranz_info({
                                    //             Name: msg.from.first_name,
                                    //             telegramId: chatId,
                                    //             Active: true,
                                    //             url: invoice.url,
                                    //             InvoiceId: invoice.id,
                                    //             Amount: parseFloat(msg.text).toFixed(3)
                                    //         }).save().then(newstate => {
                                    //             if (newstate) {
                                    //                 Tranz_info.updateMany({
                                    //                     _id: newstate._id
                                    //                 }, {
                                    //                     $set: {
                                    //                         id: newstate._id
                                    //                     }
                                    //                 }, function(err, res) {})
                                    //             }
                                    //         })


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
                                                inline_keyboard: ib.getInlineLinkRefillBalance(invoice.checkout_url)
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
                    break;
                case 'PostInput':
                    if (msg.text && msg.text.slice(0, 1) === '/' || msg.text === '/start' || msg.text === '/newpost') {

                    } else {
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
            User.find({}).then(users => {
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
            User.find({}).then(users => {
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
            Tranz_info.findOne({
                telegramId: chatId,
                Active: true
            }).then(tranz_info => {
                request('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5', function(error, response, body) {
                    if (error) throw new Error(error)
                    if (response.statusCode === 200) {
                        const data = JSON.parse(body);
                        const resultrur = data.filter(item => item.ccy === 'RUR')[0];
                        const resultusd = data.filter(item => item.ccy === 'USD')[0];

                        var result = Math.ceil(((1 * resultusd.sale) * (1 / resultrur.sale)))


                        var text = `📈 Курс Qiwi ➖ 1$ = <b>${result}₽.</b>

📲 Для пополнения нажмите кнопку ниже.

📝 Пополните счет на любою сумму, не изменяя комментарий, и дождитесь оповещения от бота. \n<b>Внимание:</b> ссылка для оплаты одноразовая, для повторной оплаты сгенерируйте заново ссылку.`
                        if (!tranz_info) {
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

                                bot.editMessageText(text, {
                                    chat_id: chatId,
                                    message_id: messageId,
                                    parse_mode: 'html',
                                    disable_web_page_preview: true,
                                    reply_markup: {
                                        inline_keyboard: ib.getInlineLinkRefillBalance(qiwiurl)
                                    }

                                }).then(function(resp) {}).catch(function(error) {})
                            })
                        } else {

                            var qiwiurl = `https://w.qiwi.com/payment/form/99?currency=643&amountFraction=0&extra[%27account%27]=${config.QIWIPORTMONEY}&extra[%27comment%27]=${tranz_info._id}`
                            bot.editMessageText(text, {
                                chat_id: chatId,
                                message_id: messageId,
                                parse_mode: 'html',
                                disable_web_page_preview: true,
                                reply_markup: {
                                    inline_keyboard: ib.getInlineLinkRefillBalance(qiwiurl)
                                }

                            }).then(function(resp) {}).catch(function(error) {})
                        }
                    }
                })
            })
            break
        case 'bSC':
            sendCity(chatId, messageId, query, data, 0)
            break
        case 'backSelState':
            sendState(chatId, messageId, query, data, 0, query)
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
    switch (type.slice(0, 3)) {
        case 'SCi':
            sendViewProduct(chatId, messageId, query, type.slice(3))
            break
        case 'SSt':
            sendCity(chatId, messageId, query, type.slice(3), 0)
            break
        case 'pPr':
            var spli = type.slice(3).split('@#')
            Promise.all([
                User.findOne({
                    telegramId: chatId
                }),
                Product.findOne({
                    telegramId: 'false',
                    State: spli[0],
                    City: spli[1],
                    Type: spli[2]
                })
            ]).then(([user, product]) => {
                if (product) {
                    Type.findOne({
                        Name: product.Type
                    }).then(type => {
                        if (user.Balance >= type.Price) {
                            AdminArray.forEach(c => {
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
            getInlineListStates(chatId, messageId, states, type.Name, temp + countState, type.Price)
        } else {
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
        } else {
            User.updateMany({
                telegramId: chatId
            }, {
                $set: {
                    Way: '',
                    TempData: ''

                }
            }, function(err, res) {})
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

    var spli = data.split('@#')
    Promise.all([
        City.find({
            State: spli[0],
            Type: spli[1]
        }).skip(temp).limit(countState).sort({
            Name: 1
        }),
        State.findOne({
            Name: spli[0],
            Type: spli[1]
        }),
    ]).then(([citys, state]) => {
        if (citys.length) {
            Type.findOne({
                Name: spli[1]
            }).then(type => {
                getInlineListCitys(chatId, messageId, citys, type.Name, state.Name, temp + countState, query, type.Price)
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

async function getInlineListCitys(chatId, messageId, citys, typeName, stateName, last, query, pricetype) {
    const cityNames = citys.map(citys => citys.Name);
    const typeNames = citys.map(citys => citys.Type);
    const stateNames = citys.map(citys => citys.State);

    const allProducts = await Product.find({
        City: {
            $in: cityNames
        },
        State: {
            $in: stateNames
        },
        Type: {
            $in: typeNames
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
                            type: `SCi${c.Name}@#${c.State}@#${c.Type}`
                        })
                    }],
                )
                i++

            } else {
                arr[i - 1].push({
                    text: `${c.Name} | ${count} »`,
                    callback_data: JSON.stringify({
                        type: `SCi${c.Name}@#${c.State}@#${c.Type}`
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
        var txt = citys[0].Type === 'Google Voice' ? 'код телефона' : 'Город'
        request('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5', function(error, response, body) {
            if (error) throw new Error(error)
            if (response.statusCode === 200) {
                const datas = JSON.parse(body);
                const resultrur = datas.filter(item => item.ccy === 'RUR')[0];
                const resultusd = datas.filter(item => item.ccy === 'USD')[0];

                var result = Math.ceil(((1 * resultusd.sale) * (pricetype / resultrur.sale)))
                bot.editMessageText(`Ваши данные:\n- <b>Тип:</b> ${typeName}.\n- <b>Штат:</b> ${stateName}.\n- <b>Стоимость:</b> ${pricetype}$ (~${result}₽).\nТеперь выберите, интересующий Вас ${txt}:`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'html',
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: arr
                    }

                })
            }
        })
    } else {
        bot.answerCallbackQuery({
            callback_query_id: query.id,
            show_alert: true,
            text: `💤 По Вашему запросу нечего не найдено! Повторите попытку позже. `
        })
    }
}




function sendViewProduct(chatId, messageId, query, data) {
    var spli = data.split('@#')
    log(spli)
    Product.find({
        City: spli[0],
        State: spli[1],
        Type: spli[2],
        telegramId: 'false'
    }).then(products => {

        Product.findOne({
            City: spli[0],
            State: spli[1],
            Type: spli[2],
            telegramId: 'false'
        }).then(product => {
            if (product) {
                request('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5', function(error, response, body) {
                    if (error) throw new Error(error)
                    if (response.statusCode === 200) {
                        const data = JSON.parse(body);
                        const resultrur = data.filter(item => item.ccy === 'RUR')[0];
                        const resultusd = data.filter(item => item.ccy === 'USD')[0];


                        Promise.all([
                            State.findOne({
                                Name: product.State,
                                Type: product.Type
                            }),
                            City.findOne({
                                Name: product.City,
                                Type: product.Type,
                                State: product.State
                            }),
                            Type.findOne({
                                Name: product.Type
                            })
                        ]).then(([state, city, type]) => {

                            var txt = product.Name === 'Google Voice' ? 'Код телефона' : 'Город'
                            var priceRub = Math.ceil(((type.Price * resultusd.sale) * (1 / resultrur.sale)))


                            bot.editMessageText(`🛍 Вы заполнили необходимые данные!\n___\n- <b>Название:</b>  ${product.Name}.\n- <b>Штат:</b> ${state.Name}.\n- <b>${txt}:</b> ${city.Name}.\n- <b>Доступно:</b> ${products.length}шт.\n\n<i>После покупки, бот мгновенно пришлет вам данные, согласно запросу!</i>`, {
                                chat_id: chatId,
                                message_id: messageId,
                                parse_mode: 'html',
                                disable_web_page_preview: true,
                                reply_markup: {
                                    inline_keyboard: ib.getInlinePayProducts(product, type.Price, priceRub)
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



async function getInlineListStates(chatId, messageId, states, typeName, last, typePrice) {
    const statesNames = states.map(state => state.Name);
    const statesTypes = states.map(state => state.Type);
    const allProducts = await Product.find({
        State: {
            $in: statesNames
        },
        Type: {
            $in: statesTypes
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
                            type: `SSt${c}@#${typeName}`,
                        })
                    }],
                )
                i++

            } else {
                arr[i - 1].push({
                    text: `${c} | ${count} »`,
                    callback_data: JSON.stringify({
                        type: `SSt${c}@#${typeName}`,
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
        request('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5', function(error, response, body) {
            if (error) throw new Error(error)
            if (response.statusCode === 200) {
                const data = JSON.parse(body);
                const resultrur = data.filter(item => item.ccy === 'RUR')[0];
                const resultusd = data.filter(item => item.ccy === 'USD')[0];

                var result = Math.ceil(((1 * resultusd.sale) * (typePrice / resultrur.sale)))
                bot.editMessageText(`Ваши данные:\n- <b>Тип:</b> ${typeName}.\n- <b>Стоимость:</b> ${typePrice}$ (~${result}₽)\nТеперь выберите, интересующий Вас штат:`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'html',
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: arr
                    }

                }).then(function(resp) {}).catch(function(error) {})
            }
        })
    }

}




async function getInlineListType(chatId, messageId, types, edit) {
    var arr = []
    const typesNames = types.map(types => types.Name);
    var result

    const allProducts = await Product.find({
        Type: {
            $in: typesNames
        },
        telegramId: 'false'
    });
    request('https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5', function(error, response, body) {
        if (error) throw new Error(error)
        if (response.statusCode === 200) {
            const data = JSON.parse(body);
            const resultrur = data.filter(item => item.ccy === 'RUR')[0];
            const resultusd = data.filter(item => item.ccy === 'USD')[0];



            types.forEach(c => {

                const count =
                    allProducts.filter(product => product.Type === c.Name)
                    .length ||
                    0;

                result = Math.ceil(((c.Price * resultusd.sale) * (1 / resultrur.sale)))



                if (count > 0) {

                    arr.push(
                        [{
                            text: `${c.Name} - ${c.Price}$ (~${result}₽) | ${count} »`,
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

    })


}
