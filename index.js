require('dotenv').config()

const express = require('express')
const app = express()
// const  port = 4000

const githubData={
    "login": "Eshan-Mishra",
    "id": 128164974,
    "node_id": "U_kgDOB6Okbg",
    "avatar_url": "https://avatars.githubusercontent.com/u/128164974?v=4",
    "gravatar_id": "",
    "url": "https://api.github.com/users/Eshan-Mishra",
    "html_url": "https://github.com/Eshan-Mishra",
    "followers_url": "https://api.github.com/users/Eshan-Mishra/followers",
    "following_url": "https://api.github.com/users/Eshan-Mishra/following{/other_user}",
    "gists_url": "https://api.github.com/users/Eshan-Mishra/gists{/gist_id}",
    "starred_url": "https://api.github.com/users/Eshan-Mishra/starred{/owner}{/repo}",
    "subscriptions_url": "https://api.github.com/users/Eshan-Mishra/subscriptions",
    "organizations_url": "https://api.github.com/users/Eshan-Mishra/orgs",
    "repos_url": "https://api.github.com/users/Eshan-Mishra/repos",
    "events_url": "https://api.github.com/users/Eshan-Mishra/events{/privacy}",
    "received_events_url": "https://api.github.com/users/Eshan-Mishra/received_events",
    "type": "User",
    "user_view_type": "public",
    "site_admin": false,
    "name": "Eshan-mishra",
    "company": null,
    "blog": "",
    "location": null,
    "email": null,
    "hireable": null,
    "bio": "B.Tech CS  Student at itm sls baroda university| Passionate about Technology and Computer Science",
    "twitter_username": null,
    "public_repos": 22,
    "public_gists": 0,
    "followers": 3,
    "following": 3,
    "created_at": "2023-03-17T15:07:21Z",
    "updated_at": "2025-03-10T19:04:13Z"
  }

app.get('/', (req,res)=>{
    res.send("hello world")
})

app.get('/twitter',(req,res)=>{
    res.send('eshan hai mahan ')
})

app.get('/login',(req, res)=>{
    res.send("<h1>please login at your bank account</h1>")
})

app.get('/chai',(req, res)=>{
    res.send('<h2>kya hai </h2>')
})

app.get('/github',(req,res)=>{
    res.json(githubData)
})

app.listen(process.env.PORT,()=>{
    console.log(`Example app is listing to port ${process.env.PORT}`)
})

