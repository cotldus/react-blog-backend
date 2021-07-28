import express from 'express';
import { MongoClient } from 'mongodb'
import { async } from 'regenerator-runtime';
import path from 'path';

const app = express();


app.use(express.static(path.join(__dirname,"/build")))
app.use(express.json());

const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db('my-blog');

        await operations(db);

        client.close();
    } catch (err) {
        res.status(500).send({ message: 'Database Error', err });
    }
}

app.get('/api/articles/:name', async (req, res) => {
        withDB(async (db) => {
            const articleName = req.params.name;
        
            const articlesInfo = await db.collection('articles').findOne({"name": articleName})
        
            res.status(200).json(articlesInfo);
        }, res);


})

app.post('/api/articles/:name/upvote', async (req, res) => {
    const articleName = req.params.name;

    await withDB(async db => {
        const articleInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, { '$set': {
            upvotes: articleInfo.upvotes + 1,
        }});
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updatedArticleInfo);
    });
});

app.post('/api/articles/:name/add-comment', (req,res) => {
    const {username, text} = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection("articles").findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName}, {
            '$set': {
                comments: articleInfo.comments.concat({username, text}),
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName});
        res.status(200).json(updatedArticleInfo)
    }, res)

})


// all other api calls that are not caught should be passed to our app
// I don't know why but this allows us to view the frontend on port 8000 as well
app.get('*' , (req , res)=>{

   res.sendFile(path.join(__dirname + 'build/index.html'));

})

app.listen(8000, ()=> console.log('listening on port 8000'));


// const articlesInfo = {
//     'learn-react' : {upvotes: 0, comments: []},
//     'learn-node' : {upvotes: 0, comments: []},
//     'my-thoughts-on-resumes' : {upvotes: 0, comments: []},
// }