require("dotenv").config({ path: __dirname + "/.env" });
const { twitterClient } = require("./twitterClient.js");
const CronJob = require("cron").CronJob;
const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');


const configuration = new Configuration({
    organization: " org-qcdxhVTle64n1lOuIHQTyYj0",
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express()
app.use(bodyParser.json())
const port = process.env.PORT || 3001;


app.post("/tweet", async (req, res) => {

    let {prompt, seconds, minutes, hours  } = req.body;
    if(!seconds) {
        return res.json({
            message: "Please provide seconds"
        })
    }
    if(!minutes) {
        minutes='*';
    }
    if(!hours) {
        hours='*'
    }
    
    
    const cronTweet = new CronJob(` ${seconds} ${minutes} ${hours} * * *`, async () => {

        try {
            const completion =  await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: [
                    {role: "user", content: `${prompt}`},
                ],
                max_tokens: 4000,
                temperature: 0.9,
                // top_p: 1,
                frequency_penalty: 0.5,
                presence_penalty: 0.0,
                // stop: ["\n\n"]
            });
            console.log(completion.data.choices[0].message.content);
            await twitterClient.v2.tweet(`${completion.data.choices[0].message.content}`);
            console.log("Tweeted");
          } catch (e) {
            console.log(e)
          }
      });
      
    cronTweet.start();
    res.json({
        message: "Tweet scheduled"
    });
});



app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})