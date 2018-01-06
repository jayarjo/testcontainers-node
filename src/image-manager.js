const log = require('debug')('testcontainers:ImageManager')

class ImageManager {
  constructor ({ docker }) {
    this.docker = docker
  }

  async exists (image) {
    log('checking if image exists', image)
    const images = await this.docker.listImages()
    const tags = images.map(image => image.RepoTags[0])
    return tags.some(tag => tag.indexOf(image) !== -1)
  }

  async pull (image) {
    log('pulling image', image)
    await new Promise((resolve, reject) => {
      this.docker.pull(image, (err, stream) => {
        if (err) {
          reject(err)
        }
        stream.pipe(process.stdout)
        stream.once('end', resolve)
      })
    })
  }
}

module.exports = ImageManager