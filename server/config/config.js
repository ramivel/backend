process.env.PORT = process.env.PORT || 3010;
process.env.NODE_ENV = 'production';
process.env.CADUCIDAD_TOKEN = 60 * 60 * 24 * 30;
process.env.SEED = process.env.SEED || 'desarrollo';

process.env.PGUSER = "postgres";
process.env.PGHOST = "localhost";
process.env.PGPASSWORD = "postgres";
process.env.PGDATABASE = "prueba";
process.env.PGPORT = 5432;