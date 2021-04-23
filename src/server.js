import express, { json } from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname,'/build')))
app.use(json());

const withDB = async (operations) => {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology:true});
    try {
        await client.connect();
        const db = client.db('my-blog');
        
        await operations(db);

    } catch (error) {
        res.status(500).json({ message: 'Error connecting to mongodb', error});
    } finally {
        client.close();
    }
}

app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;    

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(articlesInfo);
     });
});    

app.post('/api/articles/:name/upvote', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;    

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articlesInfo.upvotes + 1,
            },
        }); 

        const updateArticlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updateArticlesInfo);
    }, res);
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articlesInfo.comments.concat({ username, text }),
            },            
        });   

        const updateArticlesInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updateArticlesInfo);
    }, res);  
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})

app.listen(8000, () => console.log('Listening on port 8000'));