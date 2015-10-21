//
//       Marcos Kazuya Yamazaki
//       NUSP: 7577622 
//       EP2-MAC420 Comp Grafica
//


function loadObjFile(data) {
	// TO DO:   (i) Parse OBJ file and extract vertices and normal vectors
	// TO DO:  (ii) If normal vectors are not in the file, you will need to calculate them
	// TO DO: (iii) Return vertices and normals and any associated information you might find useful
    var inf = {
        vert: [],
        norm: [],
        fac: [],
        diffx: 0.0,
        diffy: 0.0,
        diffz: 0.0,
        
        pontosMax: []
    }

	var f = data.target.files[0]; 
    if (f) {
        var r = new FileReader();
        r.onload = function(e) {
	        // contents contem a string do documento que lemos!!!! <<<<<<<<<<<<<<<<<<
	        var contents = e.target.result;  
            var temp;
            contents = contents.split(/\n/);
            var gvx = -100.0,
                lvx = 100.0,
                gvy = -100.0,
                lvy = 100.0,
                gvz = -100.0,
                lvz = 100.0;

	        for(var n = 0; n < contents.length; n++){
	        	//alert(n + ": " + contents[n]);
	            if(contents[n].search(/v +/) == 0) {
	            	temp = contents[n].replace(/v +/, '');
	                temp = temp.split(/ +/);
	            
                    temp[0] = parseFloat(temp[0]);
                    temp[1] = parseFloat(temp[1]);
                    temp[2] = parseFloat(temp[2]);

                    if(temp[0] > gvx) gvx = temp[0];
                    if(temp[1] > gvy) gvy = temp[1];
                    if(temp[2] > gvz) gvz = temp[2];
                    if(temp[0] < lvx) lvx = temp[0];
                    if(temp[1] < lvy) lvy = temp[1];
                    if(temp[2] < lvz) lvz = temp[2];
                    
                    inf.vert.push(vec4(temp[0], temp[1], temp[2], 1.0));
                   	//alert(inf.vert[inf.vert.length-1]);
	            }
	            else if(contents[n].search(/vn +/) == 0) {
	                temp = contents[n].replace(/vn +/, '');
	                temp = temp.split(/ +/);
	
	                temp[0] = parseFloat(temp[0]);
                    temp[1] = parseFloat(temp[1]);
                    temp[2] = parseFloat(temp[2]);

                    inf.norm.push(vec4(temp[0], temp[1], temp[2], 0.0));
                    //alert(inf.norm[inf.norm.length-1]);
	            }
	            else if(contents[n].search(/f +/) == 0) {
	                temp = contents[n].replace(/f +/, '');
	                temp = temp.split(/ +/);

	                inf.fac.push(temp[0]);
                    inf.fac.push(temp[1]);
                    inf.fac.push(temp[2]);

                    if (temp[3]) {
                        inf.fac.push(temp[2]);
                        inf.fac.push(temp[3]);
                        inf.fac.push(temp[0]);
                    }
	                //alert(inf.fac[inf.fac.length-1]);
	            }
	        }

            inf.diffx = (gvx + lvx)/2.0;
            inf.diffy = (gvy + lvy)/2.0;
            inf.diffz = (gvz + lvz)/2.0;

            inf.pontosMax.push((gvx-inf.diffx)/0.5); 
            inf.pontosMax.push((gvy-inf.diffy)/0.5); 
            inf.pontosMax.push((gvz-inf.diffz)/0.5);

            loadObject(inf);  
        }
        r.readAsText(f);
    } else { 
        alert("Erro ao carregar arquivo");
    }  


}