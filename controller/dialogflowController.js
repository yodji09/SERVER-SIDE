const dialogflow = require("dialogflow")
const dialogflow2 = require("@google-cloud/dialogflow")
const projectId = process.env.PROJECT_ID
const sessionId = process.env.SESSION_ID
const languageCode = process.env.LANGUAGE_CODE
const sessionClient = new dialogflow.SessionsClient()
const sessionPath = sessionClient.sessionPath(projectId, sessionId)
const Documentation = require("../model/Documentation")
const intentsClient = new dialogflow2.IntentsClient()

class DocumentationController {
  static async talkToDialogflow(req, res) {
    try {
      const { text } = req.body

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text,
            languageCode: languageCode,
          },
        },
      }

      const responses = await sessionClient.detectIntent(request)
      const result = responses[0].queryResult
      const responseSystem = await Documentation.findOne({
        keyword: result.fulfillmentText,
      })
      if (responseSystem) {
        res.status(200).json(responseSystem.data)
      } else {
        console.log(result.fulfillmentText)
        res.status(200).json(result.fulfillmentText)
      }
    } catch (error) {
      res.status(500).json({ error })
    }
  }

  static async createNewIntent(req, res) {
    try {
      const displayName = "create express"
      const trainingPhrasesParts = [
        "configure express",
        "setup express",
        "create hello world in express",
        "build express",
      ]
      const messageTexts = ["create express"]

      const agentPath = intentsClient.agentPath(process.env.PROJECT_ID)
      const trainingPhrases = []

      trainingPhrasesParts.forEach((element) => {
        const part = {
          text: element,
        }

        const trainingPhrase = {
          type: "text",
          parts: [part],
        }

        trainingPhrases.push(trainingPhrase)
      })

      const messageText = {
        text: messageTexts,
      }

      const message = {
        text: messageText,
      }

      const intent = {
        displayName: displayName,
        trainingPhrases: trainingPhrases,
        messages: [message],
      }

      const createIntentRequest = {
        parent: agentPath,
        intent: intent,
      }

      const [response] = await intentsClient.createIntent(createIntentRequest)
      console.log(`Intent ${response.name} created`)
      res.status(201).json(`Intent ${response.name} created`)
    } catch (error) {
      res.status(500).json(error)
    }
  }

  static async getAllIntents(req, res) {
    try {
      const projectAgentPath = intentsClient.agentPath(process.env.PROJECT_ID)

      const request = {
        parent: projectAgentPath,
      }

      const [response] = await intentsClient.listIntents(request)
      response.forEach((intent) => {
        console.log("====================")
        console.log(`Intent name: ${intent.name}`)
        console.log(`Intent display name: ${intent.displayName}`)
        console.log(`Action: ${intent.action}`)
        console.log(`Root folowup intent: ${intent.rootFollowupIntentName}`)
        console.log(
          `Parent followup intent: ${intent.parentFollowupIntentName}`
        )

        console.log("Input contexts:")
        intent.inputContextNames.forEach((inputContextName) => {
          console.log(`\tName: ${inputContextName}`)
        })

        console.log("Output contexts:")
        intent.outputContexts.forEach((outputContext) => {
          console.log(`\tName: ${outputContext.name}`)
        })
      })

      res.status(200).json(response)
    } catch (error) {
      res.status(500).json(error)
    }
  }
}

module.exports = DocumentationController
