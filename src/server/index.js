// This will be our application entry. We'll set up our server here
import app from '../app'

const PORT = parseInt(process.env.PORT, 10) || 8000

app.listen(PORT, () => {
  console.log(`app running on port ${PORT}`)
})
