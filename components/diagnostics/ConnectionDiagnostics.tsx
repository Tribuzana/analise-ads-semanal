'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function ConnectionDiagnostics() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testConnection = async () => {
    setTesting(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-connection')
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnóstico de Conexão</CardTitle>
        <CardDescription>
          Verifique se a conexão com o Supabase está funcionando
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={testing}>
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            'Testar Conexão'
          )}
        </Button>

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">Conexão OK</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-600">Erro na Conexão</span>
                </>
              )}
            </div>

            {result.env && (
              <div className="text-sm space-y-1">
                <p>
                  <strong>URL:</strong> {result.env.url}
                </p>
                <p>
                  <strong>Chave:</strong> {result.env.key}
                </p>
              </div>
            )}

            {result.error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                <strong>Erro:</strong> {result.error}
              </div>
            )}

            {result.message && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                {result.message}
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Dica:</strong> Se a conexão falhar:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Verifique se o arquivo .env.local existe na raiz do projeto</li>
            <li>Reinicie o servidor Next.js (Ctrl+C e depois npm run dev)</li>
            <li>Verifique se as variáveis estão corretas no .env.local</li>
            <li>Verifique o console do navegador para mais detalhes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
