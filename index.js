#!/usr/bin/env node

const inquirer = require('inquirer')
const fetch = require('node-fetch')
const CLI = require('clui')
const spinner = CLI.Spinner
const chalk = require('chalk')
const figlet = require('figlet')
const clear = require('clear')

const { spawn } = require('child_process')

clear()

console.log(
    chalk.red(
        figlet.textSync('ytSearch', { horizontalLayout: 'full' })
    )
)

const baseURL = "https://www.googleapis.com/youtube/v3/search?"
const API_KEY = "AIzaSyB3Ji92LQdLdc7F0h-TUdnOGKg5JS7Ae7w"
const part = "snippet"
const maxResults = 15

const isEmpty = (value) => {
    return value.length > 0
}

const videos_search = async (q) => {
    let query = q.trim().split(" ").filter(isEmpty).join("+")
    let url = `${baseURL}key=${API_KEY}&part=${part}&maxResults=${maxResults}&q=${query}`
    let videos = {}

    const response = await fetch(url)
    const data = await response.json()

    data.items.map(video => videos[video.id.videoId] = video.snippet.title)
    return videos
}

const ask_input = () =>{
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
    let status = new spinner("Searching Please wait...")
    status.start()
    
    videos_search(params.query).then(videos => {
        status.stop()
        let titles = Object.values(videos)
        
        choose_options(titles).then(resp => {
            let video_id = Object.keys(videos).filter( (k ,i) => videos[k] === resp.video)[0]
            let video_url = `https://www.youtube.com/watch?v=${video_id}`

            choose_player(video_url)
        })            
    })
})
