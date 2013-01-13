/**
 * @author RX
 */
//----------------------------------------------------------------------------
// Class CCollidableFace : contains transformed points and normal of a face to collide with
//----------------------------------------------------------------------------
CCollidableFace = function(iFace, a, b, c, d, vN) {
    this.m_iFace = iFace;
	this.m_a = a;
	this.m_b = b;
	this.m_c = c;
	this.m_d = d;
	this.m_vN = new THREE.Vector3 (vN.x, vN.y, vN.z);
}
//----------------------------------------------------------------------------
// Class CCollisionObject : object that can collide with the ball
//----------------------------------------------------------------------------
CCollisionObject = function(mesh, strName) {
	this.m_Mesh = mesh;
	this.m_Matrix = new THREE.Matrix4 ();
	this.m_Velocity = new THREE.Vector3 (0, 0, 0);
	this.m_fFriction = 2000.0;
	this.m_fVelocityMax = 500.0;
	this.m_strName = strName;
	this.m_arFaces = new Array ();		// Liste des faces utilisées pour les collision
	this.m_arVertices = new Array ();	// Liste des vertex transformés par la matrice de rotation de l'objet
	this.applyRotations ();
}
// Add a collidable face for collisions system
CCollisionObject.prototype.addColidableFace = function(iFace) {
	if (iFace < this.m_Mesh.geometry.faces.length) {
		var face = this.m_Mesh.geometry.faces [iFace];
		this.m_arFaces [this.m_arFaces.length] = new CCollidableFace (iFace, face.a, face.b, face.c, face.d, face.normal);
	}
	return this
}
// Add a collidable face for collisions system according to its normal
CCollisionObject.prototype.addColidableFaceFromNormal = function(vNormal) {
	var i;
	var bFound = false;
	for (i = 0; !bFound && (i < this.m_Mesh.geometry.faces.length); i++) {
		var vFaceNormal = this.m_Mesh.geometry.faces [i].normal;
		bFound = vFaceNormal.x == vNormal.x && vFaceNormal.y == vNormal.y && vFaceNormal.z == vNormal.z;
		if (bFound) this.addColidableFace (i)
	} 
	return bFound
}
// Make all faces of the object collidables
CCollisionObject.prototype.makeAllFacesColidable = function() {
	var i;
	for (i = 0; i < this.m_Mesh.geometry.faces.length; i++) this.addColidableFace (i); 
	return this
}
// Move the object
CCollisionObject.prototype.move = function(x, y, z) {
	this.m_Mesh.position.x = x;
	this.m_Mesh.position.y = y;
	this.m_Mesh.position.z = z;
	this.m_Matrix.elements [12] = this.m_Mesh.position.x;
	this.m_Matrix.elements [13] = this.m_Mesh.position.y;
	this.m_Matrix.elements [14] = this.m_Mesh.position.z;
	return this
}
// Add a centered rotation to the object 
CCollisionObject.prototype.addRotation = function(x, y, z) {
	this.m_Mesh.rotation.x += x;
	this.m_Mesh.rotation.y += y;
	this.m_Mesh.rotation.z += z;
	return this
}
// Add a velocity vector to the current velocity of the object
CCollisionObject.prototype.addVelocity = function(x, y, z) {
	this.m_Velocity.x += x;
	this.m_Velocity.y += y;
	this.m_Velocity.z += z;
	var fLength = this.m_Velocity.length ();
	if (fLength > this.m_fVelocityMax) 
	{
		var fReduction = this.m_fVelocityMax / fLength;
		this.m_Velocity.x *= fReduction;
		this.m_Velocity.y *= fReduction;
		this.m_Velocity.z *= fReduction;
	}
	return this
}
// Update object position according to its velocity
CCollisionObject.prototype.update = function(deltaTime) {
	this.m_Mesh.position.x += this.m_Velocity.x * deltaTime;
	this.m_Mesh.position.y += this.m_Velocity.y * deltaTime;
	this.m_Mesh.position.z += this.m_Velocity.z * deltaTime;
	if (this.m_Velocity.x > 0) {
		this.m_Velocity.x -= deltaTime * this.m_fFriction;
		if (this.m_Velocity.x < 0) this.m_Velocity.x = 0;
	} else if (this.m_Velocity.x < 0) {
		this.m_Velocity.x += deltaTime * this.m_fFriction;
		if (this.m_Velocity.x > 0) this.m_Velocity.x = 0;
	}
	if (this.m_Velocity.y > 0) {
		this.m_Velocity.y -= deltaTime * this.m_fFriction;
		if (this.m_Velocity.y < 0) this.m_Velocity.y = 0;
	} else if (this.m_Velocity.y < 0) {
		this.m_Velocity.y += deltaTime * this.m_fFriction;
		if (this.m_Velocity.y > 0) this.m_Velocity.y = 0;
	}
	if (this.m_Velocity.z > 0) {
		this.m_Velocity.z -= deltaTime * this.m_fFriction;
		if (this.m_Velocity.z < 0) this.m_Velocity.z = 0;
	} else if (this.m_Velocity.z < 0) {
		this.m_Velocity.z += deltaTime * this.m_fFriction;
		if (this.m_Velocity.z > 0) this.m_Velocity.z = 0;
	}
	this.move (this.m_Mesh.position.x, this.m_Mesh.position.y, this.m_Mesh.position.z);
	return this
}
// Apply all the rotations to the object
CCollisionObject.prototype.applyRotations = function() {
	this.m_Matrix.identity ();
	this.m_Matrix.setRotationFromEuler (this.m_Mesh.rotation, "");
	this.move (this.m_Mesh.position.x, this.m_Mesh.position.y, this.m_Mesh.position.z);
	this.applyTransformation ();
	return this
}
// Apply transformation matrix to vertices and normals
CCollisionObject.prototype.applyTransformation = function() {
	var i;
	for (i = 0; i < this.m_Mesh.geometry.vertices.length; i++) {
		var v = this.m_Mesh.geometry.vertices [i];
		var vTransform = new THREE.Vector3 (v.x, v.y, v.z);
		applyRotationMatrix (vTransform, this.m_Matrix);
		this.m_arVertices [i] = vTransform;
	}
	for (i = 0; i < this.m_arFaces.length; i++) {
		var collidableFace = this.m_arFaces [i];
		var face = this.m_Mesh.geometry.faces [collidableFace.m_iFace];
		collidableFace.m_vN = new THREE.Vector3 (face.normal.x, face.normal.y, face.normal.z);
		applyRotationMatrix (collidableFace.m_vN, this.m_Matrix);
	}
}
//----------------------------------------------------------------------------
// Class CCollision : manage collisions between scene elements and the ball
//----------------------------------------------------------------------------
CCollision = function() {
	this.m_ObjectArray = new Array();
	this.m_DebugArray  = new Array()
}
// Add an object to the collision system
CCollision.prototype.add = function(object) {
	this.m_ObjectArray [this.m_ObjectArray.length] = object;
	return this
}
// Compute collisions between the moving ball and all registered objects
CCollision.prototype.collide = function(vPosStart, vPosStop, Ball) {
	var i = 0;
	var bCollided = false;
	// On parcours tous les mesh pour voir s'il y a collision avec ces derniers
	for (i = 0; i < this.m_ObjectArray.length; i++) {
		bCollided = this.collideMesh (vPosStart, vPosStop, Ball, this.m_ObjectArray [i]) || bCollided 
	}
	return bCollided
}
// Compute collisions between the moving ball and one registered object
CCollision.prototype.collideMesh = function(vPosStart, vPosStop, Ball, object) {
	var i = 0;
	var bCollided = false;
	var bFoundCollision = true;
	var fBallRadius = Ball.m_fRadius;
	
	// On recommence tant qu'on trouve une collision
	while (bFoundCollision) {
		// Calculs préalables
		var vStartStop = new THREE.Vector3 (vPosStop.x - vPosStart.x, vPosStop.y - vPosStart.y, vPosStop.z - vPosStart.z);
		// On parcours toutes les faces du mesh pour trouver la collision la plus proche s'il y en a
		var iFaceCollided = -1;
		var fMinDist = 10000.0;
		var vCollisionCenter;
		var vCollisionProjection;
		var vCollisionNormal;
		bFoundCollision = false;
		iFaceCollided = -1;
		for (i = 0; i < object.m_arFaces.length; i++) {
			// On récupère la face du mesh à traiter
			var collidableFace = object.m_arFaces [i];
			var vA = new THREE.Vector3 (object.m_arVertices [collidableFace.m_a].x + object.m_Mesh.position.x, object.m_arVertices [collidableFace.m_a].y + object.m_Mesh.position.y, object.m_arVertices [collidableFace.m_a].z + object.m_Mesh.position.z);
			var vB = new THREE.Vector3 (object.m_arVertices [collidableFace.m_b].x + object.m_Mesh.position.x, object.m_arVertices [collidableFace.m_b].y + object.m_Mesh.position.y, object.m_arVertices [collidableFace.m_b].z + object.m_Mesh.position.z);
			var vC = new THREE.Vector3 (object.m_arVertices [collidableFace.m_c].x + object.m_Mesh.position.x, object.m_arVertices [collidableFace.m_c].y + object.m_Mesh.position.y, object.m_arVertices [collidableFace.m_c].z + object.m_Mesh.position.z);
			var vD = new THREE.Vector3 (object.m_arVertices [collidableFace.m_d].x + object.m_Mesh.position.x, object.m_arVertices [collidableFace.m_d].y + object.m_Mesh.position.y, object.m_arVertices [collidableFace.m_d].z + object.m_Mesh.position.z);
			var vN = new THREE.Vector3 (collidableFace.m_vN.x, collidableFace.m_vN.y, collidableFace.m_vN.z); 
			// La première chose à faire est de vérifier que le point de départ n'est pas en collision avec la face
			// On calcule le vecteur entre le point de départ et un point de la face 
			var vAS = new THREE.Vector3 (vPosStart.x - vA.x, vPosStart.y - vA.y, vPosStart.z - vA.z);
			// On calcule la distance entre la face et le centre de la balle grace au vecteur vAS
			var fDistFaceCenter = vAS.dot (vN);
			// Si la face est à une distance inférieure au rayon de la balle, on vérifie si la balle touche réellement la face et pas simplement le plan de la face  
			if (Math.abs (fDistFaceCenter) < fBallRadius) {
				// On calcule la projection de vPosStart sur le plan de la face
				var vStartProj = new THREE.Vector3 (vPosStart.x - vN.x * fDistFaceCenter, vPosStart.y - vN.y * fDistFaceCenter, vPosStart.z - vN.z * fDistFaceCenter);
				// Et on vérifie si le point est bien dans le cadre de la face
				if (isPointIntoQuad (vA, vB, vC, vD, vN, vStartProj)) {
					// Il y a collision avec la face : il faut immédiatement déplacer la balle pour éviter la collision
					var fMoveDistToAvoidCollision = fBallRadius - fDistFaceCenter;
					var vAvoidCollision = new THREE.Vector3 (vN.x * fMoveDistToAvoidCollision, vN.y * fMoveDistToAvoidCollision, vN.z * fMoveDistToAvoidCollision);
					vPosStart.addSelf (vAvoidCollision);
					vPosStop.addSelf (vAvoidCollision);
					// Ce déplacement ajoute également à la vitesse de la balle dans la direction de déplacement
					// Ainsi que la vitesse de déplacement de l'objet
					Ball.addVelocity (vAvoidCollision.x + object.m_Velocity.x * 0.001, vAvoidCollision.y + object.m_Velocity.y * 0.001, vAvoidCollision.z + object.m_Velocity.z * 0.001);
				}
			}
			
			// Ensuite le but est de calculer le moment où la balle touche la face et si c'est entre vPosStart et vPosStop
			var fDotN = vStartStop.dot (vN);
			// On vérifie d'abord que la normale n'est pas perpendiculaire à la trajectoire (fDotN = 0) sinon il n'y aura pas de collision
			// Et que sa direction est bien opposée au mouvement (fDotN > 0 => dans le même sens)
			if (fDotN < 0.0) {
				// Et on cherche le point sur vStartStop qui est à la distance fBallRadius de la face
				//    fDist correspond a un facteur qui multiplié par vStartStop donne la position du centre de la balle lors de l'impact 
				//    (si fDist = 0 le point d'intersection est vPosStart, si fDist = 1 le point d'intersection est vPosStop)
				var fDist = (fBallRadius - fDistFaceCenter) / fDotN;
				
				// On n'inclu pas le 0 qui signifirait qu'on prend en compte la collision avec le point de départ ce qui pourrait nous faire tomber dans une boucle infinie 
				if (fDist > 0.0 && fDist <= 1.0) {
					// On vient de trouver un point sur la trajectoire qui est à une distance de fBallRadius du plan infini formé par un point de la face et sa normale
					var vI = new THREE.Vector3 (vPosStart.x + vStartStop.x * fDist, vPosStart.y + vStartStop.y * fDist, vPosStart.z + vStartStop.z * fDist);
					// On calcule le projeté sur le plan de la face
					var vH = new THREE.Vector3 (vI.x - vN.x * fBallRadius, vI.y - vN.y * fBallRadius, vI.z - vN.z * fBallRadius);
					// Maintenant il faut vérifier que la balle touche bien le cadre de la face en cette position et n'est pas en dehors
					if (isPointIntoQuad (vA, vB, vC, vD, vN, vH)) {
						// On vient de trouver un point de collision, s'il est plus proche que les autres on le garde pour la suite
						if (!bFoundCollision || (fDist < fMinDist)) {
							iFaceCollided = i;
							fMinDist = fDist;
							vCollisionCenter = vI;
							vCollisionNormal = vN;
							vCollisionProjection = vH;
							bFoundCollision = true
						}
					}					 
				}
			}
		}
		if (bFoundCollision) {
			// Il y a collision : on gère le rebond 
			// On commence par récupérer la position de rebond
			var vC = vCollisionCenter;
			// Puis on calcule le symétrique de vPosStop par rapport à vC
			var fDistSym = (fMinDist * 2.0) - 1.0;
			var vSym = new THREE.Vector3 (vPosStart.x + fDistSym * vStartStop.x, vPosStart.y + fDistSym * vStartStop.y, vPosStart.z + fDistSym * vStartStop.z);
			// Ensuite on calcule le projeté de vSym sur face.normal
			var vCSym = new THREE.Vector3 (vSym.x - vC.x, vSym.y - vC.y, vSym.z - vC.z);
			var fHProj = vCollisionNormal.dot (vCSym);
			var vProj = new THREE.Vector3 (vC.x + vCollisionNormal.x * fHProj, vC.y + vCollisionNormal.y * fHProj, vC.z + vCollisionNormal.z * fHProj);
			// Enfin on calcule le symetrique de vSym par rapport à vProj
			// Et par la même occasion on redéfinie les positions de départ et d'arrivée
			vPosStart.x = vC.x;
			vPosStart.y = vC.y;
			vPosStart.z = vC.z;
			vPosStop.x = vProj.x + vProj.x - vSym.x;
			vPosStop.y = vProj.y + vProj.y - vSym.y;
			vPosStop.z = vProj.z + vProj.z - vSym.z;
			// On ajoute à la balle la vitesse actuelle de déplacement de l'objet
			vPosStop.x += object.m_Velocity.x * 0.001;
			vPosStop.y += object.m_Velocity.y * 0.001;
			vPosStop.z += object.m_Velocity.z * 0.001;
		}
		bCollided = bCollided || bFoundCollision; 
	}
	return bCollided
}
