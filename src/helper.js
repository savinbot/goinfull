module.exports = {
    getChatId(msg) {
        return msg.chat.id
    },

    getNameUser(refonelevels, refOneLevels) {
        refonelevels += refOneLevels.map(f => {
            const caption = `- Имя: <a href="tg://user?id=${f.telegramId}">${f.Name}</a>`
            return caption
        })
        return refonelevels
    },

    getCountActiveRef(arrayRef, countactiveref, date) {
        arrayRef.forEach(u => {
            u.forEach(c => {
                if (c.TimeOff > date) {
                    countactiveref++
                }
            })
        })

        return countactiveref
    }
}