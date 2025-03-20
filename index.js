require('dotenv').config()

const express = require('express')
const app = express()
const port = 4000

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

app.listen(process.env.PORT,()=>{
    console.log(`Example app is listing to port ${process.env.PORT}`)
})

