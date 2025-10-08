const Client = require('./helpers/Client')
const { fetchString, fetchNothing } = require('@overleaf/fetch-utils')
const ClsiApp = require('./helpers/ClsiApp')
const Settings = require('@overleaf/settings')

describe('Simple LaTeX file', function () {
  before(async function () {
    this.project_id = Client.randomId()
    this.request = {
      resources: [
        {
          path: 'main.tex',
          content: `\
\\documentclass{article}
\\begin{document}
Hello world
\\end{document}\
`,
        },
      ],
      options: {
        metricsPath: 'clsi-perf',
        metricsMethod: 'priority',
      },
    }

    await ClsiApp.ensureRunning()
    try {
      this.body = await Client.compile(this.project_id, this.request)
    } catch (error) {
      this.error = error
    }
  })

  it('should return the PDF', function () {
    const pdf = Client.getOutputFile(this.body, 'pdf')
    pdf.type.should.equal('pdf')
  })

  it('should return the log', function () {
    const log = Client.getOutputFile(this.body, 'log')
    log.type.should.equal('log')
  })

  it('should provide the pdf for download', async function () {
    const pdf = Client.getOutputFile(this.body, 'pdf')
    const response = await fetchNothing(pdf.url)
    response.status.should.equal(200)
  })

  it('should provide the log for download', async function () {
    const log = Client.getOutputFile(this.body, 'pdf')
    const response = await fetchNothing(log.url)
    response.status.should.equal(200)
  })

  it('should gather personalized metrics', async function () {
    const body = await fetchString(`${Settings.apis.clsi.url}/metrics`)
    body
      .split('\n')
      .some(line => {
        return (
          line.startsWith('compile') &&
          line.includes('path="clsi-perf"') &&
          line.includes('method="priority"')
        )
      })
      .should.equal(true)
  })
})
