/**
 * requelize error wrapper
 */
class RequelizeError extends Error {
  constructor (message) {
    super(message)

    this.name = 'RequelizeError'

    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = RequelizeError
