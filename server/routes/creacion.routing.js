const express = require('express')
const router = express.Router();
const { verificaToken } = require('../middlewares/autenticacion');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { validarJWT } = require('../middlewares/validador-jwt');   
const { validarCampos } = require('../middlewares/validar-campos');

const { Pool } = require('pg');
const client = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
client.connect();

router.get('/departamento', function (req, res) {
    client.query(`select * from cat_departamento`, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.get('/departamentoAsignado/:id',[validarJWT], function (req, res) {
    client.query(`SELECT * FROM cat_departamento WHERE id_departamento = ANY(
        select unnest(STRING_TO_ARRAY(a_departamento,',')::INT[]) from seg_usuario where id_usuario=${ Number(req.params.id)}) order by 1`, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.get('/rol',[validarJWT], function (req, res) {
    client.query(`select * from seg_rol where estado='ELABORADO' AND id_rol in (8,9) `, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.get('/readRolCodificacion',[validarJWT], function (req, res) {
    client.query(`select * from seg_rol where id_rol=24`, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.get('/omision',[validarJWT], function (req, res) {
    client.query(`select codigo id, descripcion codigo from cat_catalogo where catalogo='cat_omision' and estado='ELABORADO'`, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.get('/usuarios/:departamento',[validarJWT], function (req, res) {
    client.query(`SELECT su.*, INITCAP(cd.nombre) AS nom_depto, sr.descripcion as cargo
    FROM seg_usuario su
    INNER JOIN cat_departamento cd ON su.id_departamento = cd.id_departamento
    INNER JOIN seg_rol sr ON sr.id_rol = su.id_rol 
    WHERE case when 0=${req.params.departamento} then cd.codigo ilike '%%' else cd.id_departamento=${req.params.departamento} end
    AND su.estado = 'ELABORADO' 
    AND su.id_rol IN (8, 9)
    ORDER BY su.LOGIN DESC
    `, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                message: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.post('/usuarios',[validarJWT], [check('login', 'El login es requerido').not().isEmpty(),
    check('nombre', 'El nombre es requerido').not().isEmpty(),
    check('id_rol', 'El rol es requerido').not().isEmpty(),
    check('id_departamento', 'El departamento es requerido').not().isEmpty(),
    check('password', 'La contraseña es requerida').not().isEmpty(),
    check('password', 'El pasword debe de ser mas de 8 letras').isLength({min:8}),
    check('password', ' Al menos una mayuscula, minuscula, numero y un caracter especial').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])([A-Za-z\d$@$!%*?&]|[^ ]){8,15}$/), validarCampos], async (req, res) => {
    const { id_departamento, login, nombre, id_rol, password } = req.body;
    await client.query("INSERT INTO seg_usuario (id_departamento, login, password, nombre, id_rol, usucre) VALUES ($1, $2, $3, $4, $5, $6)", [id_departamento, login, bcrypt.hashSync(password, 10), nombre, id_rol, req.body.usucre], (err, result) => {
        if (err) {
            if (err.code === '23505') {
                return res.status(400).json({
                    ok:false,
                    msg: `Ya existe el registro en la base de datos. (${login})`,
                    dup: true
                })
            }else {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
        }
        return res.status(200).json(`${login} creado`)
    })
});

router.put('/usuarios',[validarJWT], [check('login', 'El login es requerido').not().isEmpty(),
    check('nombre', 'El nombre es requerido').not().isEmpty(),
    check('id_rol', 'El rol es requerido').not().isEmpty(),
    check('password', 'La contraseña es requerida').not().isEmpty(),
    check('id_departamento', 'La contraseña es requerida').not().isEmpty(),
    check('password', 'La contraseña debe tener minimo 8 caracteres').isLength({min:8}),
    check('password', 'la contraseña debe contener al menos una mayuscula, minuscula, numero y caracter especial').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])([A-Za-z\d$@$!%*?&]|[^ ]){8,15}$/), validarCampos], async (req, res) => {
    const { id_usuario, id_departamento, login, nombre, id_rol } = req.body;
    await client.query('UPDATE seg_usuario SET id_departamento = $1, login = $2, nombre = $3, id_rol = $4 , usumod = $6, fecmod = NOW(), password = $7 WHERE id_usuario = $5', [id_departamento, login, nombre, id_rol, id_usuario, req.body.usucre, bcrypt.hashSync(req.body.password, 10)], (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).json(`${login} actualizado.`)
    }) 
});

router.delete('/usuarios/:id',[validarJWT], async (req, res) => {/*-----------------------aqui------------------------*/
    const id = req.params.id;
    await client.query("UPDATE seg_usuario SET estado='ELIMINADO' WHERE id_usuario = $1", [id], (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).json(`Registro eliminado.`)
    })   
});

router.put('/usuarios/:id',[validarJWT], async (req, res = response) => {/*-----------------------aqui------------------------*/
    const id = req.params.id;
    const { nombre, login } = req.body;
    await client.query('UPDATE seg_usuario SET nombre = $1 WHERE id_usuario = $2', [nombre, id], (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).json(`${login} actualizada.`)
    }) 
});

router.put('/actualizarPass/:id', [validarJWT],[check('password', 'La contraseña es requerida').not().isEmpty(),
    check('password', 'El pasword debe de ser mas de 8 letras').isLength({min:8}),
    check('password', 'Al menos una mayúscula, una minúscula, un número y un caracter especial').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])([A-Za-z\d$@$!%*?&]|[^ ]){8,15}$/), validarCampos], async (req, res = response) => {/*-----------------------aqui------------------------*/
    const id = req.params.id;
    const { password } = req.body;
        await client.query('UPDATE seg_usuario SET password = $1 WHERE id_usuario = $2', [bcrypt.hashSync(password, 10), id], (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
            return res.status(200).json(`Password actualizado.`)
        }) 
});

router.get('/preguntas', [validarJWT],  verificaToken, function (req, res) {
    client.query(`select * from enc_pregunta where estado='ELABORADO' order by codigo_pregunta`, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.get('/preguntas/:id', [validarJWT],  verificaToken, function (req, res) {
    const id = req.params.id;
    client.query(`SELECT * FROM enc_pregunta WHERE id_pregunta = $1`, [id], (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.get('/preguntastipo', [validarJWT],  function (req, res) {
    client.query(`SELECT * FROM cat_tipo_pregunta WHERE estado='ELABORADO'`, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.get('/preguntascat', [validarJWT],  function (req, res) {
    client.query(`SELECT distinct catalogo from cat_catalogo order by catalogo`, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.get('/preguntasres/:id', [validarJWT],  function (req, res) {
    const id = req.params.id;
    client.query(`SELECT respuesta FROM enc_pregunta WHERE id_pregunta = $1`, [id], (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});


router.post('/preguntas', [validarJWT],  async (req, res) => {
    if(req.body.id_rol_token === 0 || req.body.id_rol_token === 16 ||req.body.id_rol_token === 17){
        const { id_seccion, ayuda, id_tipo_pregunta, minimo, maximo, catalogo, longitud, usucre, codigo_pregunta, pregunta, respuesta, saltos, regla, apoyo, inicial, omision } = req.body;
        await client.query("INSERT INTO enc_pregunta (id_seccion, ayuda, id_tipo_pregunta, minimo, maximo, catalogo, longitud, usucre, codigo_pregunta, pregunta, respuesta, saltos, regla, apoyo, inicial, omision) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)", [id_seccion, ayuda, id_tipo_pregunta, minimo, maximo, catalogo, longitud, usucre, codigo_pregunta, pregunta, JSON.stringify(respuesta), JSON.stringify(saltos), JSON.stringify(regla), ayuda, inicial, JSON.stringify(omision)], (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
            return res.status(200).json(`${codigo_pregunta} creado`)
        })  
    } else {
        return res.status(400).json({
            ok:false,
            msg: 'No tiene autorización para realizar esta operación',
        })
    } 
});


router.put('/preguntas', [validarJWT],  async (req, res) => {
    if(req.body.id_rol_token === 0 || req.body.id_rol_token === 16 ||req.body.id_rol_token === 17){
    const { id_pregunta, id_seccion, codigo_pregunta, pregunta, id_tipo_pregunta, respuesta, saltos, regla, minimo, maximo, longitud, catalogo, apoyo, inicial, omision, ayuda, usucre } = req.body;
    await client.query('UPDATE enc_pregunta SET id_seccion=$1, codigo_pregunta = $2, pregunta = $3, id_tipo_pregunta=$4, respuesta=$5, saltos=$6, regla=$7, minimo=$8, maximo=$9, longitud=$10, catalogo=$11, apoyo=$12, inicial=$13, omision=$14, ayuda=$15, usucre=$16 WHERE id_pregunta = $17', [id_seccion, codigo_pregunta, pregunta, id_tipo_pregunta, JSON.stringify(respuesta), JSON.stringify(saltos), JSON.stringify(regla), minimo, maximo, longitud, catalogo, apoyo, inicial, JSON.stringify(omision), ayuda, usucre, id_pregunta], (err, result) => {
        
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message
            })
        }
        
        return res.status(200).json(`${codigo_pregunta} actualizado.`)
    }) 
} else {
    return res.status(400).json({
        ok:false,
        msg: 'No tiene autorización para realizar esta operación',
    })
}       
});

router.delete('/preguntas/:id', [validarJWT],  async (req, res) => {
    if(req.body.id_rol_token === 0 || req.body.id_rol_token === 16 ||req.body.id_rol_token === 17){
        const id = req.params.id;
        await client.query("UPDATE enc_pregunta SET estado='ELIMINADO' where id_pregunta = $1", [id], (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
            return res.status(200).json(`Registro eliminado.`)
        })    
    } else {
        return res.status(400).json({
            ok:false,
            msg: 'No tiene autorización para realizar esta operación',
        })
    }  
});

/* NIVEL */

router.get('/nivel',  [validarJWT], function (req, res) {
    client.query(`select * from enc_nivel where estado='ELABORADO' order by id_nivel`, (err, result) => {
        if (err) {
            return res.status(400).json({
                ok:false,
                msg: err.message,
            })
        }
        return res.status(200).send(result.rows)
    })
});

router.put('/nivel', [validarJWT],  async (req, res) => {
    if(req.body.id_rol_token === 0 || req.body.id_rol_token === 16 ||req.body.id_rol_token === 17){
        const { id_nivel, nivel, descripcion } = req.body;
        await client.query('UPDATE enc_nivel SET nivel = $1, descripcion = $2 WHERE id_nivel = $3', [nivel, descripcion, id_nivel], (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
            return res.status(200).json(`${nivel} actualizado.`)
        })   
    } else {
        return res.status(400).json({
            ok:false,
            msg: 'No tiene autorización para realizar esta operación',
        })
    }       
});

router.delete('/nivel/:id',  [validarJWT], async (req, res) => {
    if(req.body.id_rol_token === 0 || req.body.id_rol_token === 16 ||req.body.id_rol_token === 17){
        const id = req.params.id;
        await client.query("UPDATE enc_nivel SET estado='ELIMINADO' WHERE id_nivel = $1", [id], (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
            return res.status(200).json(`Registro eliminado.`)
        })   
    } else {
        return res.status(400).json({
            ok:false,
            msg: 'No tiene autorización para realizar esta operación',
        })
    }   
});

router.post('/nivel', [validarJWT],  async (req, res) => {
    if(req.body.id_rol_token === 0 || req.body.id_rol_token === 16 ||req.body.id_rol_token === 17){
        const { nivel, descripcion } = req.body;
        await client.query("INSERT INTO enc_nivel (id_nivel_padre, nivel, descripcion, usucre) VALUES (1, $1, $2, 'admin')", [nivel, descripcion], (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
            return res.status(200).json(`${nivel} creado`)
        })
    } else {
        return res.status(400).json({
            ok:false,
            msg: 'No tiene autorización para realizar esta operación',
        })
    }
});

/* SECCION */

router.get('/seccion', [validarJWT],  verificaToken, async (req, res) => {
    const response = await client.query("SELECT * from enc_seccion WHERE estado='ELABORADO' order by codigo");
    res.json(response.rows);
});

router.put('/seccion', async (req, res) => {
    if(req.body.id_rol_token === 0 || req.body.id_rol_token === 16 ||req.body.id_rol_token === 17){
        const { id_seccion, id_nivel, codigo, seccion } = req.body;
        await client.query('UPDATE enc_seccion SET id_nivel = $1, codigo = $2, seccion = $3 WHERE id_seccion = $4', [id_nivel, codigo, seccion, id_seccion], (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
            return res.status(200).json(`${codigo} actualizado.`)
        })   
    } else {
        return res.status(400).json({
            ok:false,
            msg: 'No tiene autorización para realizar esta operación',
        })
    }   
});

router.post('/seccion', [validarJWT],  async (req, res) => {
  if(req.body.id_rol_token === 0 || req.body.id_rol_token === 16 ||req.body.id_rol_token === 17){
        const { id_nivel, codigo, seccion } = req.body;
        await client.query("INSERT INTO enc_seccion (id_nivel, codigo, seccion, usucre) VALUES ($1, $2, $3, 'admin')", [id_nivel, codigo, seccion], (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
            return res.status(200).json(`${codigo} creado`)
        })
    } else {
        return res.status(400).json({
            ok:false,
            msg: 'No tiene autorización para realizar esta operación',
        })
    }
});

router.delete('/seccion/:id', [validarJWT],  async (req, res) => {
    if(req.body.id_rol_token === 0 || req.body.id_rol_token === 16 ||req.body.id_rol_token === 17){
        const id = req.params.id;
        await client.query("UPDATE enc_seccion SET estado='ELIMINADO' WHERE id_seccion = $1", [id], (err, result) => {
            if (err) {
                return res.status(400).json({
                    ok:false,
                    msg: err.message,
                })
            }
            return res.status(200).json(`Registro eliminado.`)
        })    
    } else {
        return res.status(400).json({
            ok:false,
            msg: 'No tiene autorización para realizar esta operación',
        })
    }  
});

module.exports = router;
