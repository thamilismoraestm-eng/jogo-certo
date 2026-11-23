import { z } from "zod";

export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(3, { error: "Informe seu nome completo." }),
    email: z.email({ error: "Digite um e-mail válido." }),
    senha: z.string().min(8, { error: "A senha deve ter pelo menos 8 caracteres." }),
    confirmacaoSenha: z.string().min(1, { error: "Confirme sua senha." }),
    tipoUsuario: z.enum(["aluno", "professor"], {
      error: "Escolha estudante ou professor.",
    }),
  })
  .refine((dados) => dados.senha === dados.confirmacaoSenha, {
    path: ["confirmacaoSenha"],
    error: "As senhas não coincidem.",
  });

export const loginSchema = z.object({
  email: z.email({ error: "Digite um e-mail válido." }),
  senha: z.string().min(1, { error: "Digite sua senha." }),
});

export type CadastroForm = z.infer<typeof cadastroSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
