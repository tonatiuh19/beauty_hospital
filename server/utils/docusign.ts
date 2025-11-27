import docusign from "docusign-esign";
import fs from "fs";

const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY || "";
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID || "";
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID || "";
const DOCUSIGN_BASE_PATH =
  process.env.DOCUSIGN_BASE_PATH || "https://demo.docusign.net/restapi";
const DOCUSIGN_PRIVATE_KEY_PATH = process.env.DOCUSIGN_PRIVATE_KEY_PATH || "";
const DOCUSIGN_AUTH_SERVER =
  process.env.DOCUSIGN_AUTH_SERVER || "account-d.docusign.com";

export function isDocuSignConfigured(): boolean {
  return !!(
    DOCUSIGN_INTEGRATION_KEY &&
    DOCUSIGN_USER_ID &&
    DOCUSIGN_ACCOUNT_ID &&
    DOCUSIGN_PRIVATE_KEY_PATH &&
    fs.existsSync(DOCUSIGN_PRIVATE_KEY_PATH)
  );
}

export async function getDocuSignClient(): Promise<docusign.ApiClient> {
  const apiClient = new docusign.ApiClient();
  apiClient.setBasePath(DOCUSIGN_BASE_PATH);
  apiClient.setOAuthBasePath(DOCUSIGN_AUTH_SERVER);

  // Read private key from file
  if (!DOCUSIGN_PRIVATE_KEY_PATH || !fs.existsSync(DOCUSIGN_PRIVATE_KEY_PATH)) {
    throw new Error("DocuSign private key file not found");
  }

  const privateKey = fs.readFileSync(DOCUSIGN_PRIVATE_KEY_PATH, "utf8");

  try {
    const results = await apiClient.requestJWTUserToken(
      DOCUSIGN_INTEGRATION_KEY,
      DOCUSIGN_USER_ID,
      ["signature", "impersonation"],
      privateKey,
      3600,
    );

    const accessToken = results.body.access_token;
    apiClient.addDefaultHeader("Authorization", `Bearer ${accessToken}`);

    return apiClient;
  } catch (error: any) {
    console.error("Error authenticating with DocuSign:", error);

    // Check if consent is required
    if (error.response?.body?.error === "consent_required") {
      const consentUrl = `https://${DOCUSIGN_AUTH_SERVER}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${DOCUSIGN_INTEGRATION_KEY}&redirect_uri=${process.env.APP_URL}/docusign/callback`;
      console.error(
        `\n⚠️  DocuSign consent required. Admin must visit: ${consentUrl}\n`,
      );
      throw new Error(`DocuSign consent required. Visit: ${consentUrl}`);
    }

    throw new Error("Failed to authenticate with DocuSign");
  }
}

export async function createContractEnvelope(
  patientName: string,
  patientEmail: string,
  serviceName: string,
  totalAmount: number,
  sessionsIncluded: number,
  termsAndConditions: string,
  contractNumber: string,
  returnUrl?: string,
): Promise<{ envelopeId: string; signingUrl: string }> {
  try {
    const apiClient = await getDocuSignClient();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    // Create the contract document content
    const documentContent = generateContractHTML(
      patientName,
      serviceName,
      totalAmount,
      sessionsIncluded,
      termsAndConditions,
      contractNumber,
    );

    // Create envelope definition
    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = `Contrato de Servicio - ${serviceName}`;
    envelopeDefinition.status = "sent";

    // Add document
    const document = new docusign.Document();
    document.documentBase64 = Buffer.from(documentContent).toString("base64");
    document.name = `Contrato_${contractNumber}.html`;
    document.fileExtension = "html";
    document.documentId = "1";
    envelopeDefinition.documents = [document];

    // Add signer with clientUserId for embedded signing
    const signer = new docusign.Signer();
    signer.email = patientEmail;
    signer.name = patientName;
    signer.recipientId = "1";
    signer.routingOrder = "1";
    signer.clientUserId = `client_${Date.now()}`; // Unique ID for embedded signing

    // Add signature tab
    const signHere = new docusign.SignHere();
    signHere.documentId = "1";
    signHere.pageNumber = "1";
    signHere.recipientId = "1";
    signHere.tabLabel = "SignHereTab";
    signHere.xPosition = "100";
    signHere.yPosition = "650";

    // Add date signed tab
    const dateSigned = new docusign.DateSigned();
    dateSigned.documentId = "1";
    dateSigned.pageNumber = "1";
    dateSigned.recipientId = "1";
    dateSigned.tabLabel = "DateSignedTab";
    dateSigned.xPosition = "100";
    dateSigned.yPosition = "700";

    const tabs = new docusign.Tabs();
    tabs.signHereTabs = [signHere];
    tabs.dateSignedTabs = [dateSigned];
    signer.tabs = tabs;

    const recipients = new docusign.Recipients();
    recipients.signers = [signer];
    envelopeDefinition.recipients = recipients;

    // Create envelope
    const results = await envelopesApi.createEnvelope(DOCUSIGN_ACCOUNT_ID, {
      envelopeDefinition,
    });

    const envelopeId = results.envelopeId!;

    // Create recipient view (embedded signing)
    const recipientViewRequest = new docusign.RecipientViewRequest();
    recipientViewRequest.returnUrl =
      returnUrl ||
      `${process.env.APP_URL || "http://localhost:8080"}/admin/appointments`;
    recipientViewRequest.authenticationMethod = "none";
    recipientViewRequest.email = patientEmail;
    recipientViewRequest.userName = patientName;
    recipientViewRequest.clientUserId = signer.clientUserId; // Must match signer's clientUserId

    const viewResults = await envelopesApi.createRecipientView(
      DOCUSIGN_ACCOUNT_ID,
      envelopeId,
      { recipientViewRequest },
    );

    return {
      envelopeId,
      signingUrl: viewResults.url!,
    };
  } catch (error) {
    console.error("Error creating DocuSign envelope:", error);
    throw new Error("Failed to create contract envelope");
  }
}

export async function getEnvelopeStatus(envelopeId: string): Promise<{
  status: string;
  completedDateTime?: string;
  declinedDateTime?: string;
}> {
  try {
    const apiClient = await getDocuSignClient();
    const envelopesApi = new docusign.EnvelopesApi(apiClient);

    const envelope = await envelopesApi.getEnvelope(
      DOCUSIGN_ACCOUNT_ID,
      envelopeId,
    );

    return {
      status: envelope.status || "unknown",
      completedDateTime: envelope.completedDateTime,
      declinedDateTime: envelope.declinedDateTime,
    };
  } catch (error) {
    console.error("Error getting envelope status:", error);
    throw new Error("Failed to get envelope status");
  }
}

function generateContractHTML(
  patientName: string,
  serviceName: string,
  totalAmount: number,
  sessionsIncluded: number,
  termsAndConditions: string,
  contractNumber: string,
): string {
  const currentDate = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            color: #C9A159;
            text-align: center;
            border-bottom: 2px solid #C9A159;
            padding-bottom: 10px;
        }
        .contract-number {
            text-align: right;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .section {
            margin: 20px 0;
        }
        .section-title {
            font-weight: bold;
            color: #333;
            margin-top: 20px;
        }
        .info-box {
            background: #f5f5f5;
            padding: 15px;
            border-left: 4px solid #C9A159;
            margin: 15px 0;
        }
        .signature-area {
            margin-top: 60px;
            border-top: 2px solid #333;
            padding-top: 40px;
        }
    </style>
</head>
<body>
    <h1>CONTRATO DE PRESTACIÓN DE SERVICIOS</h1>
    <div class="contract-number">Contrato No. ${contractNumber}</div>
    
    <div class="section">
        <p><strong>Fecha:</strong> ${currentDate}</p>
    </div>

    <div class="section">
        <p class="section-title">PACIENTE:</p>
        <div class="info-box">
            <p><strong>Nombre:</strong> ${patientName}</p>
        </div>
    </div>

    <div class="section">
        <p class="section-title">SERVICIO CONTRATADO:</p>
        <div class="info-box">
            <p><strong>Servicio:</strong> ${serviceName}</p>
            <p><strong>Número de Sesiones:</strong> ${sessionsIncluded}</p>
            <p><strong>Monto Total:</strong> $${totalAmount.toFixed(2)} MXN</p>
        </div>
    </div>

    <div class="section">
        <p class="section-title">TÉRMINOS Y CONDICIONES:</p>
        <div>${termsAndConditions}</div>
    </div>

    <div class="signature-area">
        <p>Al firmar este documento, el paciente acepta todos los términos y condiciones establecidos en este contrato.</p>
        <br><br>
        <p><strong>Firma del Paciente:</strong></p>
        <p>_________________________________</p>
        <p><strong>Fecha:</strong> _______________________</p>
    </div>
</body>
</html>
  `;
}
