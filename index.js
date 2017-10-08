#!/usr/bin/env node

const inquirer = require('inquirer')
const fetch = require('node-fetch')
const CLI = require('clui')
const spinner = CLI.Spinner
const chalk = require('chalk')
const figlet = require('figlet')
const clear = require('clear')

const { spawn } = require('child_process')

process.on('exit', () => clear())

clear()

console.log(
    chalk.red(
        figlet.textSync('ytSearch', { horizontalLayout: 'full' })
    )
)

const baseURL = "https://www.googleapis.com/youtube/v3/search?key=AIzaSyB3Ji92LQdLdc7F0h-TUdnOGKg5JS7Ae7w&part=snippet&maxResults=15&type=video"

const isEmpty = (value) => {
    return value.length > 0
}

const repeat = (value, count) => {
    return new Array(count +1).join(value)
}

const padLeft = (value, padding) => {
    return value + repeat(' ', padding)
}

const createRows = (data) => {
    let items = data.items
    let length = items.length
    let videoTitles = new Array(length)
    let channelTitles = new Array(length)
    let rows = new Array(length)

    let width = 0
    for (let i = 0; i < length; i++) {
        videoTitles[i] = items[i].snippet.title
        let channelTitle = items[i].snippet.channelTitle
        channelTitles[i] = channelTitle

        if (channelTitle.length > width) {
            width = channelTitle.length
        }
    }
    
    for (let j = 0; j < length; j++) {
        let value = channelTitles[j]
        let padding = width - value.length
        let left = padLeft(value, padding)
        rows[j] = `${left} : ${videoTitles[j]}`
    }

    return rows
} 

const videos_search = async (q) => {
    let query = q.trim().split(" ").filter(isEmpty).join("+")
    let url = `${baseURL}&q=${query}`
    
    const response = await fetch(url)
    const data = await response.json()

    return data
}

const ask_input = () => {
    const input_query = [{
        type: 'input',
        name: 'query',
        message: 'Search term: ',
        validate: (query) => {
            if (query.length){
                return true
            } else {
                return 'Please enter a search term: '
            }
        }
    }]

    return inquirer.prompt(input_query)
}

const choose_options = (videos) => {
    const options =[{
        type: 'list',
        name: 'video',
        pageSize: 10,
        message: 'Choose a video: ',
        choices: videos
    }]

    return inquirer.prompt(options)
}

const choose_player = (video_url) => {
    const options = [{
        type: 'list',
        name: 'player',
        message: 'Choose your video player: ',
        choices: ['vlc', 'mpv']
    }]

    return inquirer.prompt(options).then(resp => {
        const child = spawn(resp.player, [video_url], {detached:true})
        child.unref()
        process.exit()
    })
}

ask_input().then(params => {
    let status = new spinner(chalk.red("Searching Please wait..."))
    status.start()
    
    videos_search(params.query).then(videos => {        
        let id = videos.items.map( video => video.id.videoId)
        let rows = createRows(videos)
        
        status.stop()
        choose_options(rows).then(resp => {
            let video_id = id[rows.indexOf(resp.video)]
            let video_url = `https://www.youtube.com/watch?v=${video_id}`

            choose_player(video_url)
        })            
    })
})
