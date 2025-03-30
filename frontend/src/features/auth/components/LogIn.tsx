/**
 * Componente de inicio de sesiu00f3n
 */

import React from 'react';
import { Card, CardContent, Form, FormField, Button } from "semantic-ui-react";

interface LogInProps {
    /** Manejador del evento de submit del formulario */
    handleLogin: (e: React.FormEvent<HTMLFormElement>) => void;
    /** Nombre de usuario actual */
    username: string;
    /** Funciu00f3n para actualizar el nombre de usuario */
    setUsername: (username: string) => void;
}

/**
 * Componente que muestra el formulario de inicio de sesiu00f3n
 */
const LogIn: React.FC<LogInProps> = ({ handleLogin, username, setUsername }) => {
    return (
        <Card fluid>
          <CardContent header='Iniciar sesiu00f3n' />
          <CardContent>
            <Form 
              onSubmit={handleLogin} 
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const form = e.currentTarget as unknown as HTMLFormElement;
                  form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
              }}
            >
              <FormField>
                <label>Nombre de usuario</label>
                <input 
                  type="text" 
                  placeholder="Ingresa tu nombre" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  aria-label="Nombre de usuario"
                  autoComplete="username"
                />
              </FormField>
              <Button type='submit' primary disabled={!username.trim()}>Conectar</Button>
            </Form>
          </CardContent>
        </Card>
    );
};

export { LogIn };
