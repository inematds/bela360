# Deploy bela360 em VPS

Guia passo a passo para colocar o bela360 em producao.

**Dominio:** bela360.inema.online

---

## Requisitos da VPS

- **Sistema:** Ubuntu 22.04 LTS (recomendado)
- **RAM:** Minimo 2GB (recomendado 4GB)
- **CPU:** 2 vCPUs
- **Disco:** 20GB SSD
- **Portas abertas:** 22 (SSH), 80 (HTTP), 443 (HTTPS)

**Provedores sugeridos:** DigitalOcean, Vultr, Contabo, Hetzner

**IMPORTANTE:** Use `docker compose` (sem hifen) nas versoes novas do Docker.

---

## Passo 1: Preparar a VPS

### 1.1 Conectar via SSH
```bash
ssh root@SEU_IP_DA_VPS
```

### 1.2 Atualizar sistema
```bash
apt update && apt upgrade -y
```

### 1.3 Criar usuario (nao usar root em producao)
```bash
adduser bela360
usermod -aG sudo bela360
su - bela360
```

### 1.4 Instalar dependencias
```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git
sudo apt install -y git

# Relogar para aplicar grupo docker
exit
ssh bela360@SEU_IP_DA_VPS
```

---

## Passo 2: Clonar o Projeto

```bash
cd ~
git clone https://github.com/inematds/bela360.git
cd bela360
```

---

## Passo 3: Configurar Variaveis de Ambiente

### 3.1 Criar arquivo .env
```bash
cp .env.example .env
nano .env
```

### 3.2 Editar com seus valores:
```env
# App
NODE_ENV=production
API_URL=https://api.seudominio.com
FRONTEND_URL=https://seudominio.com

# Database (nao mudar se usar docker)
DATABASE_URL=postgresql://bela360:SuaSenhaForte123@postgres:5432/bela360

# Redis
REDIS_URL=redis://redis:6379

# JWT - GERAR CHAVES UNICAS!
JWT_SECRET=gerar_string_aleatoria_32_caracteres_minimo
JWT_REFRESH_SECRET=gerar_outra_string_aleatoria_32_caracteres
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://evolution:8080
EVOLUTION_API_KEY=SuaChaveEvolutionAPI123

# Postgres (para docker-compose)
POSTGRES_USER=bela360
POSTGRES_PASSWORD=SuaSenhaForte123
POSTGRES_DB=bela360
```

### 3.3 Gerar chaves JWT seguras:
```bash
# Gerar JWT_SECRET
openssl rand -base64 32

# Gerar JWT_REFRESH_SECRET
openssl rand -base64 32
```

---

## Passo 4: Configurar Dominio (Cloudflare ou DNS)

### 4.1 Apontar DNS para sua VPS:
```
Tipo    Nome              Valor
A       seudominio.com    IP_DA_VPS
A       api               IP_DA_VPS
A       whatsapp          IP_DA_VPS
```

### 4.2 Aguardar propagacao (5-30 minutos)
```bash
# Verificar se propagou
ping seudominio.com
```

---

## Passo 5: Instalar Certificado SSL (Let's Encrypt)

### 5.1 Instalar Certbot
```bash
sudo apt install -y certbot
```

### 5.2 Gerar certificados (parar containers primeiro)
```bash
sudo certbot certonly --standalone -d seudominio.com -d api.seudominio.com -d whatsapp.seudominio.com
```

### 5.3 Copiar certificados para o projeto
```bash
mkdir -p ~/bela360/docker/nginx/certs
sudo cp /etc/letsencrypt/live/seudominio.com/fullchain.pem ~/bela360/docker/nginx/certs/
sudo cp /etc/letsencrypt/live/seudominio.com/privkey.pem ~/bela360/docker/nginx/certs/
sudo chown -R $USER:$USER ~/bela360/docker/nginx/certs/
```

---

## Passo 6: Configurar Nginx para Producao

### 6.1 Editar nginx.conf
```bash
nano ~/bela360/docker/nginx/nginx.conf
```

### 6.2 Substituir conteudo:
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name seudominio.com api.seudominio.com whatsapp.seudominio.com;
        return 301 https://$server_name$request_uri;
    }

    # Frontend
    server {
        listen 443 ssl http2;
        server_name seudominio.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        location / {
            proxy_pass http://web:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # API
    server {
        listen 443 ssl http2;
        server_name api.seudominio.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api:3001;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # Evolution API (WhatsApp)
    server {
        listen 443 ssl http2;
        server_name whatsapp.seudominio.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        location / {
            proxy_pass http://evolution:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

---

## Passo 7: Subir a Aplicacao

### 7.1 Build e start
```bash
cd ~/bela360

# Subir todos os containers
docker compose -f docker-compose.prod.yml up -d --build

# Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

### 7.2 Rodar migracoes do banco
```bash
# Aguardar postgres ficar healthy (~20 segundos)
docker compose -f docker-compose.prod.yml ps

# Rodar migracao
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

### 7.3 Verificar se esta rodando
```bash
docker compose -f docker-compose.prod.yml ps
```

Deve mostrar todos os servicos "Up":
```
NAME              STATUS
bela360-api       Up
bela360-web       Up
bela360-postgres  Up (healthy)
bela360-redis     Up (healthy)
bela360-evolution Up
bela360-nginx     Up
```

---

## Passo 8: Configurar WhatsApp (Evolution API)

### 8.1 Acessar painel Evolution
```
https://whatsapp.seudominio.com/manager
```

### 8.2 Criar instancia
- Nome: `bela360_principal`
- Webhook URL: `https://api.seudominio.com/api/whatsapp/webhook`

### 8.3 Escanear QR Code
- Abra o WhatsApp no celular
- Configuracoes > Dispositivos conectados > Conectar dispositivo
- Escaneie o QR Code

---

## Passo 9: Testar

### 9.1 Testar frontend
```bash
curl https://seudominio.com
```

### 9.2 Testar API
```bash
curl https://api.seudominio.com/health
```

### 9.3 Acessar no navegador
- Frontend: https://seudominio.com
- API: https://api.seudominio.com

---

## Passo 10: Configurar Renovacao Automatica SSL

```bash
# Criar script de renovacao
sudo nano /etc/cron.d/certbot-renew

# Adicionar linha:
0 0 1 * * root certbot renew --quiet && docker-compose -f /home/bela360/bela360/docker-compose.prod.yml restart nginx
```

---

## Comandos Uteis

### Ver logs
```bash
# Todos os servicos
docker compose -f docker-compose.prod.yml logs -f

# Servico especifico
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs api --tail=50
```

### Reiniciar servicos
```bash
# Todos
docker compose -f docker-compose.prod.yml restart

# Especifico
docker compose -f docker-compose.prod.yml restart api
```

### Parar tudo
```bash
docker compose -f docker-compose.prod.yml down
```

### Atualizar codigo
```bash
cd ~/bela360
git pull origin main
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Rebuild apenas um servico
```bash
docker compose -f docker-compose.prod.yml build api --no-cache
docker compose -f docker-compose.prod.yml up -d api
```

### Backup do banco
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U bela360 bela360 > backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
cat backup_20240104.sql | docker compose -f docker-compose.prod.yml exec -T postgres psql -U bela360 bela360
```

---

## Troubleshooting

### Container nao sobe / reiniciando em loop
```bash
# Ver logs detalhados
docker compose -f docker-compose.prod.yml logs api --tail=100

# Erros comuns (ja corrigidos no codigo):
# - "Queue name cannot contain :" -> Nomes das filas corrigidos
# - "maxRetriesPerRequest must be null" -> bullmqConnection separada
# - "Prisma failed to detect libssl" -> OpenSSL instalado no Dockerfile
```

### Erro de conexao com banco
```bash
# Verificar se postgres esta rodando
docker compose -f docker-compose.prod.yml ps postgres

# Testar conexao
docker compose -f docker-compose.prod.yml exec api sh -c "nc -zv postgres 5432"
```

### Erro 502 Bad Gateway
```bash
# Verificar se os servicos estao saudaveis
docker compose -f docker-compose.prod.yml ps

# Reiniciar nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### WhatsApp nao conecta
```bash
# Ver logs do Evolution
docker compose -f docker-compose.prod.yml logs evolution-api

# Reiniciar Evolution
docker compose -f docker-compose.prod.yml restart evolution-api
```

### Erro no build da API
```bash
# Se der erro de "@bela360/shared not found"
# O Dockerfile ja inclui build do shared antes da API

# Rebuild completo
docker compose -f docker-compose.prod.yml build api --no-cache
```

### Erro no build do Web
```bash
# Se der erro de "public folder not found"
# Verificar se apps/web/public/.gitkeep existe

# Rebuild completo
docker compose -f docker-compose.prod.yml build web --no-cache
```

---

## Checklist Final

- [ ] VPS configurada com Ubuntu 22.04
- [ ] Docker e Docker Compose instalados
- [ ] Projeto clonado
- [ ] Arquivo .env configurado
- [ ] DNS apontando para VPS
- [ ] Certificado SSL instalado
- [ ] Nginx configurado
- [ ] Containers rodando
- [ ] Migracoes executadas
- [ ] WhatsApp conectado
- [ ] Testes realizados
- [ ] Renovacao SSL automatica configurada
- [ ] Backup configurado

---

## Custos Estimados

| Item | Custo Mensal |
|------|--------------|
| VPS 2GB RAM | $10-20 USD |
| Dominio .com | $12 USD/ano |
| SSL | Gratis (Let's Encrypt) |
| **Total** | ~$15 USD/mes |
