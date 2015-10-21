//
//       Marcos Kazuya Yamazaki
//       NUSP: 7577622 
//       EP2-MAC420 Comp Grafica
//

var program;
var canvas;
var gl;

var pointsArray  = [];   // vertices dos objetos que acabaram de ser carregados
var normalsArray = [];   // vetores normais do obj que acabaram de ser carregados
var triangulos = [];     // matriz guarda todos os vertices de todos os objetos que foram carregado

var quantidadeObj  = 1;  // quantidade de objetos na tela
var transladar     = []; // uma matriz, que guarda quanto cada objeto foi transladado em cada eixo
var escalar        = []; // a mesma coisa de cima, mas para a escala
var escalarBouding = []; // o bounding box inicial é um cubo com arestas 1, 
                         // ao saber os coordenadas min, max e o tamanho em cada eixo
                         // o bounding box de cada obj é escalado
var objSelecionado = -1; // variavel que indica qual o objeto selecionado no momento
                         // -1: nenhum objeto
var deletado = [];       // vetor que informa se o obj foi deletado da cena ou nao

eixoTransladar = [0.0,0.0,0.0];
eixoEscalar    = [0.0,0.0,0.0];

var botaoT = 0; // botao de translacao
var botaoS = 0; // botao de escala
var botaoR = 0; // botao de rotacao

// Vertices usado para o cubo no inicio
// e para a constrção do bounding box
var vertices = [
  vec4( -0.5, -0.5,  0.5, 1.0 ),
  vec4( -0.5,  0.5,  0.5, 1.0 ),
  vec4(  0.5,  0.5,  0.5, 1.0 ),
  vec4(  0.5, -0.5,  0.5, 1.0 ),
  vec4( -0.5, -0.5, -0.5, 1.0 ),
  vec4( -0.5,  0.5, -0.5, 1.0 ),
  vec4(  0.5,  0.5, -0.5, 1.0 ),
  vec4(  0.5, -0.5, -0.5, 1.0 )
];

var lightPosition = vec4( 10.0, 10.0, 10.0, 0.0 );
var lightAmbient  = vec4(  0.2,  0.2,  0.2, 1.0 );
var lightDiffuse  = vec4(  1.0,  1.0,  1.0, 1.0 );
var lightSpecular = vec4(  1.0,  1.0,  1.0, 1.0 );

var materialAmbient   = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse   = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular  = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

// transformation and projection matrices
var modelViewMatrix   , projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var matrix1Loc        , matrix2Loc;
var nColor, vColor   , bBuffer, bPosition; // bounding box buffer
var mColor, mColorLoc, mBuffer, mPosition; // manipuladores buffer

var nBuffer   = [];
var vNormal   = [];
var vBuffer   = [];
var vPosition = [];

var cBuffer = [];
var vColor  = [];

// Para fazer a rotação (NAO SEI COMO FUNCIONA ?)
var rotacaoQuaternio = vec4( 1.0, 1.0, 1.0, 1.0 );
var rotacaoQuaternioLoc;

var ambientColor, diffuseColor, specularColor;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis  = 1;
var theta = [];

var near    = -1.0;
var far     =  0.1;
var cradius =  4.0;
var ctheta  =  0.0;
var cphi    =  0.0;
var dr      =  1.0 * Math.PI/180.0;

var fovy = 45.0;  // Field-of-view in Y direction angle (in degrees)
var aspect;       // Viewport aspect ratio

var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// our universe
var xleft   = -1.0;
var xright  =  1.0;
var ybottom = -1.0;
var ytop    =  1.0;
var znear   = -100.0;
var zfar    =  100.0;

var flag = true; // flag usada para ver se o usuario quer os
                 // manipuladores com profundidade ou nao

// generate a quadrilateral with triangles
function quad(a, b, c, d) {
  var t1 = subtract(vertices[b], vertices[a]);
  var t2 = subtract(vertices[c], vertices[b]);
  var normal = vec4(cross(t1, t2), 0);

  pointsArray.push(vertices[a]); 
  normalsArray.push(normal); 
  pointsArray.push(vertices[b]); 
  normalsArray.push(normal); 
  pointsArray.push(vertices[c]); 
  normalsArray.push(normal);   
  pointsArray.push(vertices[a]);  
  normalsArray.push(normal); 
  pointsArray.push(vertices[c]); 
  normalsArray.push(normal); 
  pointsArray.push(vertices[d]); 
  normalsArray.push(normal);    
}

// define faces of a cube
function colorCube()
{
  quad( 1, 0, 3, 2 );
  quad( 2, 3, 7, 6 );
  quad( 3, 0, 4, 7 );
  quad( 6, 5, 1, 2 );
  quad( 4, 5, 6, 7 );
  quad( 5, 4, 0, 1 );
}

function boundingBox () {
  // Estou desenhando o Bounding Box 
  // O melhor jeito de fazer isso, seria usar gl.LINE_LOOP duas vezes para
  // construir a face de cima e a de baixo, e juntar com 4 linhas 
  pointsArray.length = 0;

  pointsArray.push(vertices[0]); 
  pointsArray.push(vertices[1]);
  pointsArray.push(vertices[2]); 
  pointsArray.push(vertices[3]);

  pointsArray.push(vertices[4]); 
  pointsArray.push(vertices[5]);
  pointsArray.push(vertices[6]); 
  pointsArray.push(vertices[7]);

  pointsArray.push(vertices[0]); pointsArray.push(vertices[4]);
  pointsArray.push(vertices[1]); pointsArray.push(vertices[5]);
  pointsArray.push(vertices[2]); pointsArray.push(vertices[6]);
  pointsArray.push(vertices[3]); pointsArray.push(vertices[7]);


  // Coloca a cor branca para as linhas do bounding box
  // Eu coloco as cores no mesmo vetor (normalArray)
  // Porem fiz uma mudança no vertex shader, em que ou o vertex shader
  // calcula a cor de acordo com a iluminacao e o objeto, ou
  // simplismente coloca a cor que estamos especificando aqui
  normalsArray.length = 0;
  for(i = 0; i < 16; i++) 
    normalsArray.push(vec4( 1.0, 1.0, 1.0, 1.0 ));  // white

  // criar os buffer do Bounding Box
  nColor = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, nColor );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

  vColor = gl.getAttribLocation( program, "vNormal" );
  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  bBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, bBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
  
  bPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(bPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(bPosition);
}


//  funcao que cria os vertices dos manipuladores de translacao, escala e rotacao
//  para a translacao é criado um trinagulo em 2D, para a escala é criado um 
//  pentagono, e para a rotacao é criado um "circulo" de raio 1, atraves de 180
//  vertices em torno da circunferencia 
function manipuladorTSR () {

  pointsArray.length = 0;

  pointsArray.push(vec4( 0.0    , 0.0  , 0.0 , 1.0)); // linha x
  pointsArray.push(vec4( 0.0    , 0.5  , 0.0 , 1.0)); 
  pointsArray.push(vec4(-0.04242, 0.5  , 0.0 , 1.0)); // triangulo x
  pointsArray.push(vec4( 0.04242, 0.5  , 0.0 , 1.0));
  pointsArray.push(vec4( 0.0    , 0.56 , 0.0 , 1.0)); 

  pointsArray.push(vec4( 0.0 , 0.0 , 0.0    , 1.0)); //linha x
  pointsArray.push(vec4( 0.5 , 0.0 , 0.0    , 1.0));
  pointsArray.push(vec4( 0.5 , 0.0 ,-0.04242, 1.0)); //triangulo y
  pointsArray.push(vec4( 0.5 , 0.0 , 0.04242, 1.0));
  pointsArray.push(vec4( 0.56, 0.0 , 0.0    , 1.0)); 

  pointsArray.push(vec4( 0.0    , 0.0 , 0.0 , 1.0)); // linha z
  pointsArray.push(vec4( 0.0    , 0.0 , 0.5 , 1.0));
  pointsArray.push(vec4(-0.04242, 0.0 , 0.5 , 1.0)); // triangulo z
  pointsArray.push(vec4( 0.04242, 0.0 , 0.5 , 1.0));
  pointsArray.push(vec4( 0.0    , 0.0 , 0.56, 1.0)); 

  pointsArray.push(vec4( 0.0   , 0.5  , 0.0, 1.0)); // pentagono x
  pointsArray.push(vec4( 0.0259, 0.515, 0.0, 1.0)); 
  pointsArray.push(vec4( 0.0259, 0.545, 0.0, 1.0)); 
  pointsArray.push(vec4( 0.0   , 0.56 , 0.0, 1.0)); 
  pointsArray.push(vec4(-0.0259, 0.545, 0.0, 1.0)); 
  pointsArray.push(vec4(-0.0259, 0.515, 0.0, 1.0)); 

  pointsArray.push(vec4( 0.5  , 0.0, 0.0   , 1.0)); // pentagono y
  pointsArray.push(vec4( 0.515, 0.0, 0.0259, 1.0)); 
  pointsArray.push(vec4( 0.545, 0.0, 0.0259, 1.0)); 
  pointsArray.push(vec4( 0.56 , 0.0, 0.0   , 1.0)); 
  pointsArray.push(vec4( 0.545, 0.0,-0.0259, 1.0)); 
  pointsArray.push(vec4( 0.515, 0.0,-0.0259, 1.0)); 

  pointsArray.push(vec4( 0.0    , 0.0, 0.5  ,  1.0)); // pentagono z
  pointsArray.push(vec4( 0.0259 , 0.0, 0.515,  1.0)); 
  pointsArray.push(vec4( 0.0259 , 0.0, 0.545,  1.0)); 
  pointsArray.push(vec4( 0.0    , 0.0, 0.56 ,  1.0)); 
  pointsArray.push(vec4(-0.0259 , 0.0, 0.545,  1.0)); 
  pointsArray.push(vec4(-0.0259 , 0.0, 0.515,  1.0)); 

  var pi = Math.PI/90;
  // circulo que rotaciona no eixo z
  for(i = 0; i < 90; i++) pointsArray.push(vec4( Math.cos(i*pi)/2,           Math.sin(i*pi)/2          , 0.0,1.0));
  for(i = 0; i < 90; i++) pointsArray.push(vec4( Math.cos(Math.PI + i*pi)/2, Math.sin(Math.PI + i*pi)/2, 0.0,1.0));

  // circulo que rotaciona no eixo x
  for(i = 0; i < 90; i++) pointsArray.push(vec4( 0.0, -Math.sin(i*pi)/2          , Math.cos(i*pi)/2          , 1.0));
  for(i = 0; i < 90; i++) pointsArray.push(vec4( 0.0, -Math.sin(Math.PI + i*pi)/2, Math.cos(Math.PI + i*pi)/2, 1.0));

  // circulo que rotaciona no eixo y
  for(i = 0; i < 90; i++) pointsArray.push(vec4( Math.cos(i*pi)/2          , 0.0, -Math.sin(i*pi)/2          , 1.0));
  for(i = 0; i < 90; i++) pointsArray.push(vec4( Math.cos(Math.PI + i*pi)/2, 0.0, -Math.sin(Math.PI + i*pi)/2, 1.0));

  // aqui eh usado como vetor normal, mas colocaremos os vetores das cores RGB
  normalsArray.length = 0;
  for(i = 0; i < 5; i++) normalsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));  // red
  for(i = 0; i < 5; i++) normalsArray.push(vec4( 0.0, 1.0, 0.0, 1.0 ));  // green
  for(i = 0; i < 5; i++) normalsArray.push(vec4( 0.0, 0.0, 1.0, 1.0 ));  // blue
  for(i = 0; i < 6; i++) normalsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));  // red
  for(i = 0; i < 6; i++) normalsArray.push(vec4( 0.0, 1.0, 0.0, 1.0 ));  // green
  for(i = 0; i < 6; i++) normalsArray.push(vec4( 0.0, 0.0, 1.0, 1.0 ));  // blue

  for(i = 0; i < 180; i++) normalsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));  // red
  for(i = 0; i < 180; i++) normalsArray.push(vec4( 0.0, 1.0, 0.0, 1.0 ));  // green
  for(i = 0; i < 180; i++) normalsArray.push(vec4( 0.0, 0.0, 1.0, 1.0 ));  // blue

  mColor = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, mColor );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

  mColorLoc = gl.getAttribLocation( program, "vNormal" );
  gl.vertexAttribPointer( mColorLoc, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( mColorLoc );

  mBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, mBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
  
  mPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(mPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(mPosition);
}

// Funcao que retorne TRUE caso o ponto P esteja dentro do
// triangulo com vertices nas coordenadas A B C
function barycentric (A, B, C, P){
  // Compute vectors
  var a = vec3(A);
  var b = vec3(B);
  var c = vec3(C);
  var p = vec3(P);

  var v0 = subtract(c, a);
  var v1 = subtract(b, a);
  var v2 = subtract(p, a);

  // Compute dot products
  var dot00 = dot(v0, v0);
  var dot01 = dot(v0, v1);
  var dot02 = dot(v0, v2);
  var dot11 = dot(v1, v1);
  var dot12 = dot(v1, v2);

  // Compute barycentric coordinates
  var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
  var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
  var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

  // Check if point is in triangle
  return (u >= 0) && (v >= 0) && (u + v < 1);
}

// Multiplica a matriz m pelo vetor vec
function multMat4Vec4 (m, vec) {
  var tv = [];

  tv[0] = m[0][0] * vec[0] + m[0][1] * vec[1] + m[0][2] * vec[2] + m[0][3] * vec[3];
  tv[1] = m[1][0] * vec[0] + m[1][1] * vec[1] + m[1][2] * vec[2] + m[1][3] * vec[3];
  tv[2] = m[2][0] * vec[0] + m[2][1] * vec[1] + m[2][2] * vec[2] + m[2][3] * vec[3];
  tv[3] = m[3][0] * vec[0] + m[3][1] * vec[1] + m[3][2] * vec[2] + m[3][3] * vec[3];

  return tv;
}

// Dada a coordenada e a matriz de projecao multiplicada pela matriz de modelagem
// devolve a coordenada desse vetor na tela 2D e a sua profundidade com relacao a camera
function unproject (vec, im) {

  var dest = []; //output
  var tv = [];   //transformed vector

  tv = multMat4Vec4(im, vec);
  if(tv[3] == 0.0) { return null; }

  dest[0] = tv[0] / tv[3];
  dest[1] = tv[1] / tv[3];
  dest[2] = tv[2] / tv[3];
  dest[3] = 0.0;

  return dest;
}

// Funcao que é chamada ao tentar selecionar um objeto, primeiramente veremos se o raio
// emitido pelo click do mouse intersecta algum bounding box, (olhando para todos os obj em cena)
// case isso ocorra com um objeto, todos os trinagulos dele serao verificados
// Aquele que tiver a menor profundidade sera o obj a ser selecionado
function intersect_boundingBox(pontoTela) {  

  var i, k;
  var mMatrix;
  var pMatrix = perspective(fovy, aspect, near, far);
  var im; // > mMatrix * pMatrix;

  var w = canvas.width, h = canvas.height;

  var v1,v2,v3;
  var maisProximo = 0;
  var profundidade;

  // para cada objeto, ver se o raio passa pelo bounding box dele
  for(i = 1; i < quantidadeObj; ++i) {
    if(!deletado[i]) {
      mMatrix = lookAt(eye, at, up);
      mMatrix = mult(mMatrix, translate(transladar[i]));
      mMatrix = mult(mMatrix, scale(escalar[i]));
      mMatrix = mult(mMatrix, scale(escalarBouding[i]));
      mMatrix = mult(mMatrix, rotate(theta[i][xAxis], [1, 0, 0] ));
      mMatrix = mult(mMatrix, rotate(theta[i][yAxis], [0, 1, 0] ));
      mMatrix = mult(mMatrix, rotate(theta[i][zAxis], [0, 0, 1] ));

      im = mult(pMatrix, mMatrix);

      // cada face do box, temos dois triangulos
      if(barycentric(unproject (vertices[0], im), unproject (vertices[1], im) , unproject (vertices[2], im) , pontoTela) ||
         barycentric(unproject (vertices[2], im), unproject (vertices[3], im) , unproject (vertices[0], im) , pontoTela) ||
         barycentric(unproject (vertices[4], im), unproject (vertices[5], im) , unproject (vertices[6], im) , pontoTela) ||
         barycentric(unproject (vertices[6], im), unproject (vertices[7], im) , unproject (vertices[4], im) , pontoTela) ||
         barycentric(unproject (vertices[1], im), unproject (vertices[2], im) , unproject (vertices[6], im) , pontoTela) ||
         barycentric(unproject (vertices[6], im), unproject (vertices[5], im) , unproject (vertices[1], im) , pontoTela) ||
         barycentric(unproject (vertices[0], im), unproject (vertices[3], im) , unproject (vertices[7], im) , pontoTela) ||
         barycentric(unproject (vertices[7], im), unproject (vertices[4], im) , unproject (vertices[0], im) , pontoTela) ||
         barycentric(unproject (vertices[3], im), unproject (vertices[2], im) , unproject (vertices[6], im) , pontoTela) ||
         barycentric(unproject (vertices[6], im), unproject (vertices[7], im) , unproject (vertices[3], im) , pontoTela) ||
         barycentric(unproject (vertices[0], im), unproject (vertices[1], im) , unproject (vertices[5], im) , pontoTela) ||
         barycentric(unproject (vertices[5], im), unproject (vertices[4], im) , unproject (vertices[0], im) , pontoTela) ) {

        // Se entrou aqui, é por que o raio intesectou o bounding box deste objeto, agora vamos analisar todos os triangulos desse
        // objeto para ver qual o trinagulo em que o raio intesecta (que pode ser um, alguns ou nenhum), caso tenha, guardaremos
        // o valor da profundidade desse triangulo, caso não tenha, esse objeto será descartado como opção a ser selecionado.

        for(k = 0; k < triangulos[i].length; k += 3) {

          v1 = unproject (triangulos[i][k + 0], im);
          v2 = unproject (triangulos[i][k + 1], im);
          v3 = unproject (triangulos[i][k + 2], im);

          if(barycentric(v1,v2,v3, pontoTela)) {
            if(!maisProximo) {
              maisProximo = i;
              profundidade = v3[2];
            }
            else {
              if(v3[3] < profundidade) {
                maisProximo = i;
                profundidade = v3[2];
  }}}}}}}
  // Apos comparar todos os objetos, vemos quais foram os objetos "selecionados" até então, e se tiver mais que um
  // vamos comparar os triangulos intersectados de cada objeto, aquele que tiver a menor profundidade é então selecionado
  return maisProximo;
}

// atribuir zero ao vetores do
// escalonamento e translacao  
// aos tres eixos
function zerarEixos (){
  eixoTransladar[0] = 0;
  eixoTransladar[1] = 0;
  eixoTransladar[2] = 0;
  eixoEscalar[0] = 0;
  eixoEscalar[1] = 0;
  eixoEscalar[2] = 0;
}

// atribuir 0 as variaveis que indicam qual
// a tranfomacao selecionada no momento 
function zerarTransformacao () {
  botaoT = 0; 
  botaoS = 0;
  botaoR = 0;
}

// Funções para detectar quando um dos botões do mouse ou do teclado foram clicados
// e tambem localiza em que parte do canvas isso aconteceu para a geração do raio

// eventos do mouse e teclado
var mouseDownLeft = false, mouseDownRight = false, oldX, oldY, newx, newy;
var shift = false;

function elementPos(element) {
  var x = 0, y = 0;
  while(element.offsetParent) {
    x += element.offsetLeft;
    y += element.offsetTop;
    element = element.offsetParent;
  }
  return { x: x, y: y };
}

function eventPos(event) {
  return {
    x: event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
    y: event.clientY + document.body.scrollTop + document.documentElement.scrollTop
  };
}

function canvasMousePos(event) {
  var mousePos = eventPos(event);
  var canvasPos = elementPos(canvas);
  return {
    x: mousePos.x - canvasPos.x,
    y: mousePos.y - canvasPos.y
  };
}

document.onmousedown = function(event) {
  var mouse = canvasMousePos(event);
  var mouseCanvas = canvasMousePos(event);

  var picked; // variavel que guardara o obj selecionado
  oldX = (2 * mouse.x / canvas.width) - 1;
  oldY = (-1)*((2 * mouse.y / canvas.height) - 1);  

  if(mouse.x >= 0 && mouse.x < canvas.width && 
     mouse.y >= 0 && mouse.y < canvas.height) {
    // clicou dentro do canvas
    if(event.button == 0) {
      mouseDownLeft = true;
      if (shift) {
        zerarTransformacao();
        zerarEixos();

        // selecionar objeto
        picked = intersect_boundingBox(vec4(oldX, oldY, 0.0, 0.0));
        if(picked != 0) objSelecionado = picked;
        else objSelecionado = -1;

        shift = false;
        return false;
      }
    } else if(event.button == 2) mouseDownRight = true;
    // disable selection because dragging is used for rotating the camera and moving objects
    return false;
  }
  return true;
};

document.onmousemove = function(event) {
  var mouse = canvasMousePos(event);
  var newx, newy;

  // pega os novos valores do local no canvas em que o mouse esta
  newx = (2 * mouse.x / canvas.width) - 1;
  newy = (-1)*((2 * mouse.y / canvas.height) - 1);

  if(mouseDownLeft) {
    if(!shift) {
      if(botaoT) {
        // Aplica o quanto se deve transladar em cada eixo
        transladar[objSelecionado][0] += eixoTransladar[0]*(newx-oldX);
        transladar[objSelecionado][0] += eixoTransladar[0]*(newy-oldY);
        transladar[objSelecionado][1] += eixoTransladar[1]*(newy-oldY);
        transladar[objSelecionado][1] += eixoTransladar[1]*(newx-oldX);
        transladar[objSelecionado][2] += eixoTransladar[2]*(newy-oldY);
        transladar[objSelecionado][2] += eixoTransladar[2]*(newx-oldX);
      }
      else if(botaoS) {
         // Aplica o quanto se deve escalar em cada eixo
         // Aumentar o objeto
        if(newy-oldY > 0){
          escalar[objSelecionado][0] *= 1 + eixoEscalar[0];
          escalar[objSelecionado][1] *= 1 + eixoEscalar[1];
          escalar[objSelecionado][2] *= 1 + eixoEscalar[2];
        }
        // Diminiur o objeto
        else if(newy-oldY < 0){
          escalar[objSelecionado][0] *= 1 - eixoEscalar[0];
          escalar[objSelecionado][1] *= 1 - eixoEscalar[1];
          escalar[objSelecionado][2] *= 1 - eixoEscalar[2];
        }
      }
      else if(botaoR) {
        // rotaciona o obj no eixo escolhido
        if(newy-oldY > 0) theta[objSelecionado][axis] += 2.0; 
        if(newx-oldX > 0) theta[objSelecionado][axis] += 2.0; 
        
        theta[objSelecionado][axis] = theta[objSelecionado][axis] % 360;
      }
      else {
        // rotaciona a camera
        if(newy-oldY > 0) ctheta += dr;
        else              ctheta -= dr;
        if(newx-oldX > 0) cphi += dr;
        else              cphi -= dr;
      }
    }
  }
  else if(mouseDownRight) {
    // Zoom in and zoom out, se o mouse for mexido
    // para cima ou para o lado direito,
    // os objetos irão se aumentar

    // Neste caso fazemos o zoom aumentando ou diminuindo o angulo de visao da camera 
    // Mas sem deixar inverter toda a imagem, por isso sempre verificamos se fovy continua sendo positivo
    if( fovy - (newx-oldX)*10 > 0 || fovy - (newy-oldY)*10 > 0 ) {
      fovy -= (newx-oldX)*10;
      fovy -= (newy-oldY)*10;
    }
  }
  // guarda os valores do mouse
  // para que se possa calcular a diferenca
  // na proxima iteracao
  oldX = newx
  oldY = newy;
};

document.onmouseup = function(event) {
  mouseDownLeft  = false;
  mouseDownRight = false;
  var mouse = canvasMousePos(event);
};

document.onkeydown = function(event) {

    // esc: desselecionar objeto
    if(event.keyCode == 27) {
      if(botaoS || botaoT || botaoR) {
        zerarTransformacao ();
        zerarEixos();
      }
      else objSelecionado = -1;
      return false;
    }

    // quando apertar o botao SHIFT
    if(event.keyCode == 16) {
      shift = true;  
      return false;
    }

    // t: Transladar o objeto
    if(event.keyCode == 84) {
      if(objSelecionado != -1) {
        zerarTransformacao ();
        botaoT = 1;
      }
      return false;
    }

    // s: escalar o objeto
    if(event.keyCode == 83) {
      if(shift && botaoS) { 
        // adicionei essa opcao para fazer uma escala simetrica
        eixoEscalar[0] = 0.1;
        eixoEscalar[1] = 0.1;
        eixoEscalar[2] = 0.1;
        return false;
      }
      if(objSelecionado != -1) {
        zerarTransformacao ();
        botaoS = 1;
      }
      return false;
    }

    // r: rotacionar o objeto
    if(event.keyCode == 82) {
      if(objSelecionado != -1) {
        zerarTransformacao ();
        botaoR = 1;
      }
      return false;
    }

    // x: deletar objeto ou caso umas das transformacoes estiverem 
    // selecionadas, fazer a tranformacao em relacao ao eixo x
    if(event.keyCode == 88) {
      if(botaoS || botaoT || botaoR) {
        zerarEixos();
        eixoTransladar[0] = 1;
        eixoEscalar[0] = 0.1;
        axis = 0;

      } else {
        if(objSelecionado != -1) {
          deletado[objSelecionado] = 1;
          objSelecionado = -1;

          zerarTransformacao ();
          zerarEixos();
        }
      }
      return false;
    }

    // y: fazer a transfomacao no eixo y
    if(event.keyCode == 89 && (botaoS || botaoT || botaoR)) {
      zerarEixos();
      eixoTransladar[1] = 1;
      eixoEscalar[1] = 0.1;
      axis = 1;
    }

    // z: fazer a transfomacao no eixo z
    if(event.keyCode == 90 && (botaoS || botaoT || botaoR)) {
        zerarEixos();
        eixoTransladar[2] = 1;
        eixoEscalar[2] = 0.1;
        axis = 2;
    }

    // del: deletar objeto selecionado
    if(event.keyCode == 46 && objSelecionado != -1) {
      deletado[objSelecionado] = 1;
      objSelecionado = -1;

      zerarTransformacao ();
      zerarEixos();

      return false;
    }
};

document.onkeyup = function(event) {
    // botao shift foi soltado
    if(event.keyCode == 16 ) {
      shift = false;
      return false;
    }
};

// FIM. funções de manipulacoes do mouse e teclado

// Funçao que guarda no buffer os vertices e os vetores normais do objeto i que foi carregado
function createBuffers(i) {
    nBuffer[i] = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer[i] );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    vNormal[i] = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal[i], 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal[i] );

    vBuffer[i] = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer[i] );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    vPosition[i] = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition[i], 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition[i]);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // create viewport and clear color
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    
    // enable depth testing for hidden surface removal\
    gl.enable(gl.DEPTH_TEST);

    //  load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
  
    // draw simple cube for starters
    colorCube();

    aspect = 1; // canvas.width/canvas.height;
    // create vertex and normal buffers para o cubo
    createBuffers(0);

    vBuffer[0].numItems = 36;
    escalar.push(vec3(1.0,1.0,1.0));
    escalarBouding.push(vec3(1.0,1.0,1.0));
    transladar.push(vec3(0.0,0.0,0.0));
    theta.push(vec3(0.0,0.0,0.0));
    deletado[0] = 1;
    triangulos.push([]); 

    // create light components
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    // create model view and projection matrices
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    rotacaoQuaternioLoc = gl.getUniformLocation(program, "rotacaoQuaternio");

    // uma dessas matrizes vai ser uma matrix nula e a outra identidade
    matrix1Loc = gl.getUniformLocation(program, "m1");
    matrix2Loc = gl.getUniformLocation(program, "m2");

    boundingBox ();
    manipuladorTSR ();

    document.getElementById('files').onchange = function (evt) {loadObjFile(evt);};
    document.getElementById("Button1").onclick = function(){flag = !flag;};

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct" ), flatten(ambientProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct" ), flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));  
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"  ), flatten(lightPosition)  );
    gl.uniform1f (gl.getUniformLocation(program, "shininess"      ), materialShininess       );
     
    render();
}

var render = function() {
    var i;
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    eye = vec3(cradius * Math.sin(ctheta) * Math.cos(cphi), 
               cradius * Math.sin(ctheta) * Math.sin(cphi),
               cradius * Math.cos(ctheta));

    //projectionMatrix = ortho(xleft, xright, ybottom, ytop, znear, zfar);
    projectionMatrix = perspective(fovy, aspect, near, far);

    // matrix1 é a matrix identidade, para pegar a cor final depois de calcular a iluminacao
    // caso matrix2 fosse a matrix identidade, o vertex shader pegaria a cor em RGB que contem
    // no vetor vNormal de cada vertice
    gl.uniformMatrix4fv(matrix1Loc, false, flatten(mat4(1)));
    gl.uniformMatrix4fv(matrix2Loc, false, flatten(mat4(0)));

    // Desenha cada objeto no canvas
    // objeto zero nao é desenhado por que é o cubo,
    // que é usado para desenhar o bounding box
    // do objeto selecionado caso houver algum
    for(i = 1; i < quantidadeObj; i++){
      if(!deletado[i]) {  

        modelViewMatrix = lookAt(eye, at, up);
        modelViewMatrix = mult(modelViewMatrix, translate(transladar[i]));
        modelViewMatrix = mult(modelViewMatrix, scale(escalar[i]));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[i][xAxis], [1, 0, 0] ));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[i][yAxis], [0, 1, 0] ));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[i][zAxis], [0, 0, 1] ));

        gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer[i] );
        gl.vertexAttribPointer( vNormal[i], 4, gl.FLOAT, false, 0, 0 );

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer[i] );
        gl.vertexAttribPointer( vPosition[i], 4, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(modelViewMatrixLoc , false, flatten(modelViewMatrix ));
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

        gl.drawArrays( gl.TRIANGLES, 0, vBuffer[i].numItems );
      }
    }  

    // Apos desenhar cada objeto desenha os manipuladores ou o bounding box
    // no caso de ser um manipulador a ser desenhado, verifica se ele deve ser
    // desenhado na frente de tudo ou deixa ativado o z-buffer.
    if(objSelecionado != -1) { 
      i = objSelecionado;

      gl.uniformMatrix4fv(matrix1Loc, false, flatten(mat4(0)));
      gl.uniformMatrix4fv(matrix2Loc, false, flatten(mat4(1)));

      if(botaoT){
        // desenha manipulador de translacao
        if(flag) gl.clear( gl.DEPTH_BUFFER_BIT );

        modelViewMatrix = lookAt(eye, at, up);
        modelViewMatrix = mult(modelViewMatrix, translate(transladar[i]));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

        gl.bindBuffer( gl.ARRAY_BUFFER, mColor );
        gl.vertexAttribPointer( mColorLoc, 4, gl.FLOAT, false, 0, 0 );

        gl.bindBuffer( gl.ARRAY_BUFFER, mBuffer );
        gl.vertexAttribPointer( mPosition, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays( gl.LINES,     0 , 2 ); // desenha a reta
        gl.drawArrays( gl.TRIANGLES, 2 , 3 ); // desenha o triangulo
        gl.drawArrays( gl.LINES,     5 , 2 );
        gl.drawArrays( gl.TRIANGLES, 7 , 3 );
        gl.drawArrays( gl.LINES,     10, 2 );
        gl.drawArrays( gl.TRIANGLES, 12, 3 );
      }
      else if(botaoS) {
        // desenha manipulador de escala
        if(flag) gl.clear( gl.DEPTH_BUFFER_BIT );

        modelViewMatrix = lookAt(eye, at, up);
        modelViewMatrix = mult(modelViewMatrix, translate(transladar[i]));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

        gl.bindBuffer( gl.ARRAY_BUFFER, mColor );
        gl.vertexAttribPointer( mColorLoc, 4, gl.FLOAT, false, 0, 0 );

        gl.bindBuffer( gl.ARRAY_BUFFER, mBuffer );
        gl.vertexAttribPointer( mPosition, 4, gl.FLOAT, false, 0, 0);
 
        gl.drawArrays( gl.LINES,      0 , 2 ); // desenha a reta
        gl.drawArrays( gl.LINE_LOOP, 15 , 6 ); // desenha o pentagono
        gl.drawArrays( gl.LINES,      5 , 2 );
        gl.drawArrays( gl.LINE_LOOP, 21 , 6 );
        gl.drawArrays( gl.LINES,     10 , 2 );
        gl.drawArrays( gl.LINE_LOOP, 27 , 6 );

      } else if(botaoR) {
        // desenha o manipulador de ROTACAO
        if(flag) gl.clear( gl.DEPTH_BUFFER_BIT );

        modelViewMatrix = lookAt(eye, at, up);
        modelViewMatrix = mult(modelViewMatrix, translate(transladar[i]));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

        gl.bindBuffer( gl.ARRAY_BUFFER, mColor );
        gl.vertexAttribPointer( mColorLoc, 4, gl.FLOAT, false, 0, 0 );

        gl.bindBuffer( gl.ARRAY_BUFFER, mBuffer );
        gl.vertexAttribPointer( mPosition, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays( gl.LINE_LOOP,  33 , 180 );  // desenha cada circulo em torno do centro de massa do obj
        gl.drawArrays( gl.LINE_LOOP, 213 , 180 );
        gl.drawArrays( gl.LINE_LOOP, 393 , 180 );

      } else {
        // desenha bounding box em torno desse objeto
        modelViewMatrix = lookAt(eye, at, up);
        modelViewMatrix = mult(modelViewMatrix, translate(transladar[i]));
        modelViewMatrix = mult(modelViewMatrix, scale(escalar[i]));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[i][xAxis], [1, 0, 0] ));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[i][yAxis], [0, 1, 0] ));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta[i][zAxis], [0, 0, 1] ));
        modelViewMatrix = mult(modelViewMatrix, scale(escalarBouding[i]));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

        gl.bindBuffer( gl.ARRAY_BUFFER, nColor );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );

        gl.bindBuffer( gl.ARRAY_BUFFER, bBuffer );
        gl.vertexAttribPointer( bPosition, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays( gl.LINE_LOOP, 0, 4 ); // desenha quadrado da face de cima
        gl.drawArrays( gl.LINE_LOOP, 4, 4 ); // desenha quadrado da face de baixo
        gl.drawArrays( gl.LINES,     8, 8 ); // cria 4 linhas ortogonais ligando os quadrados, assim foi desenhado o cubo
      }
    }    
    requestAnimFrame(render);
}


// CALCULA o vetor normal dos objetos carregados caso 
// o arquivo obj nao dispolibilizou 
function calc_normal(a, b, c) {
     var t1 = subtract(b, a);
     var t2 = subtract(c, b);
     var normal = vec4(cross(t1, t2), 0);

     normalsArray.push(normal); 
     normalsArray.push(normal); 
     normalsArray.push(normal);       
}

function loadObject(objInf) {
    pointsArray.length = 0;
    normalsArray.length = 0;

    var normalTemp = [];
    var objTipo = 0;

    var ordemVertice = [];
    var ordemNormal = [];

    normalTemp.length = 0;

    // apply transformation to the object so that he is centered at the origin
    for(var i = 0; i < objInf.vert.length; i++) {
        var ajust = objInf.vert[i];
        ajust[0] = ajust[0] - objInf.diffx;
        ajust[1] = ajust[1] - objInf.diffy;
        ajust[2] = ajust[2] - objInf.diffz;
    }

    // convert strings into array of vertex and normal vectors
    var tempV;
    tempV = objInf.fac[0];
    if(tempV.search(/\/\//) != -1) objTipo = 1;
    else if(tempV.search(/\/\d+\//)) objTipo = 2;

    for(var i = 0; i < objInf.fac.length; i++) {
        tempV = objInf.fac[i];

        if(objTipo == 1) {
            // obj: f v//vn v//vn v//vn
            tempV = tempV.split(/\/\//);
            tempV[0] = parseInt(tempV[0]) - 1;
            tempV[1] = parseInt(tempV[1]) - 1;

            ordemVertice.push(tempV[0]);
            ordemNormal.push(tempV[1]);

            pointsArray.push(objInf.vert[tempV[0]]);
            normalTemp.push(objInf.norm[tempV[1]]);
        }
        else if(objTipo == 2) {
            // obj: f v/vt/vn v/vt/vn v/vt/vn

            tempV = tempV.split(/\//);
            tempV[0] = parseInt(tempV[0]) - 1;
            tempV[2] = parseInt(tempV[2]) - 1;

            ordemVertice.push(tempV[0]);
            ordemNormal.push(tempV[1]);

            pointsArray.push(objInf.vert[tempV[0]]);
            normalTemp.push(objInf.norm[tempV[2]]);
        }
        else {
            // obj: f v v v
            tempV = parseInt(tempV) - 1;

            ordemVertice.push(tempV);
            pointsArray.push(objInf.vert[tempV]);
        }
    }

    //verifica se o arquivo obj esta gravado vetores normais flat ou smooth
    if(objTipo == 1 || objTipo == 2){
        if(ordemNormal[0] == ordemNormal[1] && ordemNormal[0] == ordemNormal[2]) 
            normalsArray = normalTemp;
    }

    if(normalsArray.length == 0) {
        //calcula vetores normais FLAT caso o arquivo nao passe
        for(var i = 0; i < pointsArray.length; i = i + 3){
            calc_normal(pointsArray[i], pointsArray[i+1], pointsArray[i+2]);
        }
    }

    triangulos.push(pointsArray); // copia os vertices desse obj para ficar guardado

    createBuffers(quantidadeObj); // cria buffers desse novo objetvo

    escalar.push(vec3(1.0,1.0,1.0)); // cria novo vetor de manipulacao na escala
    escalarBouding.push(vec3(objInf.pontosMax)); // criar vetor para ajeitar o bounding box no obj
    transladar.push(vec3(0.0,0.0,0.0)); // cria novo vetor de manipulacao na translacao
    theta.push(vec3(0.0,0.0,0.0));  // cria novo vetor para a manipulacao da rotacao desse obj

    objSelecionado = -1; // caso algum objeto estava selecionado, ele sera deselecionado
    zerarTransformacao (); // reseta as variaveis de transformacoes
    zerarEixos(); // reseta os vetores de manipulacao dos eixos

    deletado[quantidadeObj] = 0; // obj criado, existe
    
    vBuffer[quantidadeObj].numItems = objInf.fac.length;
    quantidadeObj = quantidadeObj + 1;
}