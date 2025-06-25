import boto3
import json
from botocore.exceptions import ClientError

def lambda_handler(event, context):
    try:
        if 'body' in event:
            body = event['body']
            if isinstance(body, str):
                body_dict = json.loads(body)
            else:
                body_dict = body  
        else:
            body_dict = event
        

        
        nome_entrega = body_dict.get('nomeEntrega')
        destinatario = body_dict.get('destinatario')
        print("Evento recebido:", event)
        print("Nome entrega:", nome_entrega)
        print("Destinatario:", destinatario)

        if not nome_entrega or not destinatario:
            return {
                'statusCode': 400,
                'body': json.dumps('Erro: Parametros obrigatorios nao fornecidos.')
            }
        
        # config do e-mail
        sender = "hppeixoto15@gmail.com"  # Substituir pelo seu e-mail verificado no SES
        subject = f"Atualização de Entrega: {nome_entrega}"
        body_text = f"Olá, aqui está a atualização sobre a entrega {nome_entrega}."
        body_html = f"""
        <html>
            <head></head>
            <body>
                <h1>Atualização de Entrega: {nome_entrega}</h1>
                <p>Olá, aqui está a atualização sobre a entrega {nome_entrega}.</p>
            </body>
        </html>
        """
        
        # config o cliente SES
        ses = boto3.client('ses', region_name='us-east-1')  
        
        # envia e-mail
        response = ses.send_email(
            Destination={
                'ToAddresses': [destinatario]
            },
            Message={
                'Subject': {
                    'Data': subject,
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Text': {
                        'Data': body_text,
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': body_html,
                        'Charset': 'UTF-8'
                    }
                }
            },
            Source=sender
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps(f'E-mail enviado com sucesso para: {destinatario}')
        }
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f'Erro ao enviar e-mail: {str(e)}')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f'Erro ao processar requisição: {str(e)}')
        }

