class BaseService {
  constructor (model) {
    this.model = model
  }

  /**
   * Single record name
   * @return {String} model name
   */
  singleRecord () {
    return this.model.toLowerCase()
  }

  /**
   * Many records name
   * @return {String} model name
   */
  manyRecords () {
    return `${this.model.toLowerCase()}s`
  }
}

export default BaseService
