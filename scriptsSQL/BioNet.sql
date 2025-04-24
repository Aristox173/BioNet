CREATE DATABASE bionet_db;
GO
USE bionet_db;

CREATE TABLE resultados_examenes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    laboratorio_id VARCHAR(50),
    paciente_id VARCHAR(50),
    tipo_examen VARCHAR(100),
    resultado TEXT,
    fecha_examen DATE,
    CONSTRAINT UQ_Examen UNIQUE (paciente_id, tipo_examen, fecha_examen)
);

CREATE TABLE log_cambios_resultados (
    id INT IDENTITY(1,1) PRIMARY KEY,
    operacion VARCHAR(10),
    paciente_id VARCHAR(50),
    tipo_examen VARCHAR(100),
    fecha DATETIME DEFAULT GETDATE()
);

CREATE TRIGGER trg_log_cambios
ON resultados_examenes
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO log_cambios_resultados (operacion, paciente_id, tipo_examen)
    SELECT
        CASE 
            WHEN EXISTS (SELECT * FROM inserted i JOIN deleted d ON i.id = d.id)
                THEN 'UPDATE'
            ELSE 'INSERT'
        END,
        paciente_id,
        tipo_examen
    FROM inserted;
END;

SELECT * FROM resultados_examenes
SELECT * FROM log_cambios_resultados

SELECT name FROM sys.databases;
GO