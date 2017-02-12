/**
 * requelize error wrapper
 */
class RequelizeError extends Error {
  constructor (message, details) {
    super(message)

    this.name = 'RequelizeError'
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = RequelizeError
