import { Card, CardContent, Form, FormField, Button } from "semantic-ui-react"

interface LogInProps {
    handleLogin: (e: React.FormEvent<HTMLFormElement>) => void;
    username: string;
    setUsername: (username: string) => void;
}

const LogIn = ({ handleLogin, username, setUsername }: LogInProps) => {
    return (
        <Card fluid>
          <CardContent header='Iniciar sesión' />
          <CardContent>
            <Form onSubmit={handleLogin} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const form = e.currentTarget as unknown as HTMLFormElement;
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
              }
            }}>
              <FormField>
                <label>Nombre de usuario</label>
                <input type="text" placeholder="Ingresa tu nombre" value={username} onChange={(e) => setUsername(e.target.value)} />
              </FormField>
              <Button type='submit'>Conectar</Button>
            </Form>
          </CardContent>
        </Card>
    )
}

export { LogIn }