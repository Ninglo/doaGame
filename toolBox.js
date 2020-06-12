exports.compareGamer = (chooses, gamers) => {
    var gamer1 = chooses[gamers[0]]
    var gamer2 = chooses[gamers[1]]
    var win1 = 0
    var win2 = 0
    for (var i = 0; i < 3; i++)
    {
        if (judge(gamer1[i], gamer2[i]))
        {
            console.log('w1')
            win1++
        }
        if (judge(gamer2[i], gamer1[i]))
        {
            console.log('w2')
            win2++
        }
        console.log(win1, win2)
    }
    if (win1 > win2)
    {
        return `${gamers[0]} win!`
    }
    if (win1 < win2)
    {
        return `${gamers[1]} win!`
    }
    else
    {
        return 'Draw'
    }

    function judge(chose1, chose2) {
        winCombination = [["hold", "punch"], ["punch", "throw"], ["throw", "hold"]]
        gameResult = [chose1, chose2]
        for (var i = 0; i < winCombination.length; i++)
        {
            if (JSON.stringify(winCombination[i]) == JSON.stringify(gameResult))
            {
                return true
            }
        }
        return false
    }
}