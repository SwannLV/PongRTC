/**
 * @author RX
 */
// Bonuses types :
var BonusType = {"SlideMore" : 0, "SlideLess" : 1, "BallSpeedMore" : 2, "BallSpeedLess" : 3, "BallSizeMore" : 4, "BallSizeLess" : 5, "ChangeBallDirection" : 6, "RotateCamera" : 7};
//----------------------------------------------------------------------------
// Class CNetElement : description and animation of a net element
//----------------------------------------------------------------------------
CNetElement = function(pos, width) {
    this.m_fHalfWidth = width/2;
	this.m_fWidthCenter = this.m_fHalfWidth/8;
	this.m_fHalfHeight = 25;
	this.m_fHalfDepth = 10;
	var NetMaterial = new THREE.MeshPhongMaterial( { color: 0xFFFFFF, transparent: true, opacity: 0.8} );
	var NetGeometry = new THREE.CubeGeometry (width, this.m_fHalfHeight * 2, this.m_fHalfDepth * 2);
	this.m_Mesh = new THREE.Mesh(NetGeometry, NetMaterial);
	this.m_Mesh.position.x = pos.x;
	this.m_Mesh.position.y = pos.y + this.m_fHalfHeight;
	this.m_Mesh.position.z = pos.z;
	this.m_iState = 0;
	this.m_iBonus = -1;
	this.m_fAnimTime = 0.0;
	this.m_fAnimTimeStart = 0.0;
	this.m_fAnimTimeEnd = 1.0;
	this.m_fRotationFactor = 1.0;
	this.m_Explode = new CExplode (this.m_Mesh, 20, 1000);
}
// Update the net element according to its state and the relative position of the ball
CNetElement.prototype.update = function(Ball, deltaTime, arBonuses) {
	// On commence par calculer la distance de la balle
	var bBonusUpdated = false;
	var iCollisionType = 0;
	var fDiffZ = Ball.m_Mesh.position.z - this.m_Mesh.position.z;
	var fDiffX = Ball.m_Mesh.position.x - this.m_Mesh.position.x;
	
	if (Math.abs (fDiffZ) <= this.m_fHalfDepth + Ball.m_fRadius)	{
		// La balle est assez proche pour rentrer en collision sur la profondeur : on vérifie la hauteur
		var fDiffY = Ball.m_Mesh.position.y - this.m_Mesh.position.y;
		if (Math.abs (fDiffY) <= this.m_fHalfHeight + Ball.m_fRadius) {
			// La balle est assez proche pour rentrer en collision sur la hauteur : on vérifie la distance sur la lageur
			if (Math.abs (fDiffX) <= this.m_fHalfWidth + Ball.m_fRadius) {
				// Il y a collision mais on distingue 2 types de collision, proche du centre (1) ou éloigné (2)
				if (Math.abs (fDiffX) <= this.m_fWidthCenter + Ball.m_fRadius) {
					iCollisionType = 1;
				} else {
					iCollisionType = 2;
				}
			}
		}
	}
	// Ensuite on gère le comportement de l'élément en fonction de son état
	switch (this.m_iState) {
		case 0: // inactif
		if (iCollisionType == 1) {
			// On passe dans l'état destruction inactive
			this.m_fAnimTimeStart = Date.now();
			this.m_fAnimTime = this.m_fAnimTimeStart;
			this.m_fAnimTimeEnd = this.m_fAnimTimeStart + 2000; 
			this.m_Mesh.visible = false;
			this.m_Explode.init (this.m_Mesh, 20, this.m_fAnimTimeEnd - this.m_fAnimTimeStart);
			this.m_iState = 2;
		}
		else if (iCollisionType == 2) {
			// On passe dans l'état rotation avant activation du bonus
			this.m_fAnimTimeStart = Date.now();
			this.m_fAnimTime = this.m_fAnimTimeStart;
			this.m_fAnimTimeEnd = this.m_fAnimTimeStart + 1000; 
			if (fDiffX * fDiffZ > 0) {
				this.m_fRotationFactor = 1.0; 
			} else {
				this.m_fRotationFactor = -1.0; 
			}
			this.m_iState = 1;
		}
		break;
		case 1: // inactif en rotation
		this.m_fAnimTime += deltaTime;
		if (this.m_fAnimTime >= this.m_fAnimTimeEnd) {
			// Rotation terminée : on active un bonus
			this.m_Mesh.rotation.y = 0;
			this.m_Mesh.material = new THREE.MeshPhongMaterial( { color: 0xFF0000, transparent: true, opacity: 0.9} );
			this.m_iBonus = Math.round (Math.random () * (arBonuses.length - 1));
			this.m_iState = 3;
		} else {
			// Rotation en cours
			var fDeltaRotation = Math.sin ((this.m_fAnimTime - this.m_fAnimTimeStart) * Math.PI / (2 * (this.m_fAnimTimeEnd - this.m_fAnimTimeStart)));
			this.m_Mesh.rotation.y = 4 * Math.PI * fDeltaRotation * this.m_fRotationFactor;
		}
		break;
		case 2: // inactif en destruction
		this.m_fAnimTime += deltaTime;
		if (this.m_fAnimTime >= this.m_fAnimTimeEnd) {
			// Destruction terminee : on passe a l'état apparition
			this.m_Mesh.visible = true;
			this.m_Mesh.scale.x = 0;
			this.m_Mesh.scale.y = 0;
			this.m_Mesh.scale.z = 0;
			this.m_fAnimTimeStart = Date.now();
			this.m_fAnimTime = this.m_fAnimTimeStart;
			this.m_fAnimTimeEnd = this.m_fAnimTimeStart + 1000; 
			this.m_Mesh.material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF, transparent: true, opacity: 0.9} );
			this.m_iState = 6;
		} else {
			/*
			// TODO : faire exploser le cube
			// Pour le moment je réduit la taille de l'élément jusqu'à 0 en effectuant un petit rebond a mi chemin
			// Pour faire ça en fonction du temps j'utilise le polynome de Berstein de degrès 3 
			// B(t) = P0*(1-t)^3 + 3*P1*t*(1-t)^2 + 3*P2*t^2*(1-t) + P3*t^3
			// avec P0=1, P1=-1, P2=1, P3=0
			var fTime = (this.m_fAnimTime - this.m_fAnimTimeStart) / (this.m_fAnimTimeEnd - this.m_fAnimTimeStart);
			var fInvTime = 1 - fTime; 
			//var fScale = fInvTime*fInvTime*fInvTime + 0.75*fTime*fInvTime*fInvTime + 2.25*fTime*fTime*fInvTime;
			var fScale = fInvTime*fInvTime*fInvTime - 3*fTime*fInvTime*fInvTime + 3*fTime*fTime*fInvTime;
			this.m_Mesh.scale.x = fScale;
			this.m_Mesh.scale.y = fScale;
			this.m_Mesh.scale.z = fScale;
			*/
		}
		break;
		case 3: // bonus activé, en attente de la balle
		if (iCollisionType == 1) {
			// On passe dans l'état destruction et activation du bonus
			this.m_fAnimTimeStart = Date.now();
			this.m_fAnimTime = this.m_fAnimTimeStart;
			this.m_fAnimTimeEnd = this.m_fAnimTimeStart + 1000; 
			arBonuses [this.m_iBonus]++;
			bBonusUpdated = true;
			this.m_iState = 5;
		}
		else if (iCollisionType == 2) {
			// On passe dans l'état rotation pour revenir a l'état inactif
			this.m_fAnimTimeStart = Date.now();
			this.m_fAnimTime = this.m_fAnimTimeStart;
			this.m_fAnimTimeEnd = this.m_fAnimTimeStart + 1000; 
			if (fDiffX * fDiffZ > 0) {
				this.m_fRotationFactor = 1.0; 
			} else {
				this.m_fRotationFactor = -1.0; 
			}
			this.m_iState = 4;
		}
		break;
		case 4: // bonus activé, en rotation
		this.m_fAnimTime += deltaTime;
		if (this.m_fAnimTime >= this.m_fAnimTimeEnd) {
			// Rotation terminée : on désactive le bonus
			this.m_Mesh.rotation.y = 0;
			this.m_Mesh.material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF, transparent: true, opacity: 0.9} );
			this.m_iBonus = 0;
			this.m_iState = 0;
		} else {
			// Rotation en cours
			var fDeltaRotation = Math.sin ((this.m_fAnimTime - this.m_fAnimTimeStart) * Math.PI / (2 * (this.m_fAnimTimeEnd - this.m_fAnimTimeStart)));
			this.m_Mesh.rotation.y = 4 * Math.PI * fDeltaRotation * this.m_fRotationFactor;
		}
		break;
		case 5: // bonus activé, en destruction
		// TODO : envoyer le bonus sur le frontend
		// Pour le moment je détruit de la même manière que lorsque c'est inactif
		this.m_Mesh.visible = false;
		this.m_Explode.init (this.m_Mesh, 20, this.m_fAnimTimeEnd - this.m_fAnimTimeStart);
		this.m_iState = 2;
		break;
		case 6: // apparition
		this.m_fAnimTime += deltaTime;
		if (this.m_fAnimTime >= this.m_fAnimTimeEnd) {
			// Apparition terminee : on passe a l'état inactif
			this.m_Mesh.scale.x = 1;
			this.m_Mesh.scale.y = 1;
			this.m_Mesh.scale.z = 1;
			this.m_iState = 0;
		} else {
			// TODO : faire exploser le cube
			// Pour le moment je réduit la taille de l'élément jusqu'à 0 en effectuant un petit rebond a mi chemin
			// Pour faire ça en fonction du temps j'utilise le polynome de Berstein de degrès 3 
			// B(t) = P0*(1-t)^3 + 3*P1*t*(1-t)^2 + 3*P2*t^2*(1-t) + P3*t^3
			// avec P0=0, P1=2, P2=-1, P3=1
			var fTime = (this.m_fAnimTime - this.m_fAnimTimeStart) / (this.m_fAnimTimeEnd - this.m_fAnimTimeStart);
			var fInvTime = 1 - fTime; 
			var fScale = 6*fTime*fInvTime*fInvTime - 3*fTime*fTime*fInvTime + fTime*fTime*fTime;
			this.m_Mesh.scale.x = fScale;
			this.m_Mesh.scale.y = fScale;
			this.m_Mesh.scale.z = fScale;
		}
		break;
	}
	
	this.m_Explode.update (deltaTime);
	
	return bBonusUpdated;
}
//----------------------------------------------------------------------------
// Class CBonusNet : manages bonuses and options
//----------------------------------------------------------------------------
CBonusNet = function(scene, elementsCount, arenaHalfWidth) {
	this.m_arElement = new Array ();
	this.m_arBonuses = new Array ();
	this.m_bBonusesUpdated = false;
	var NetElementWidth = arenaHalfWidth * 2 / elementsCount;
	var NetElementPos = -arenaHalfWidth + NetElementWidth / 2;
	var i;
	for (i = 0; i < elementsCount; i++) {
		this.m_arElement [i] = new CNetElement (new THREE.Vector3 (NetElementPos, 0, 0), NetElementWidth);
		NetElementPos += NetElementWidth;
		scene.add(this.m_arElement [i].m_Mesh);
		scene.add(this.m_arElement [i].m_Explode.m_ParticleSystem);
	}
	for (i = 0; i < BonusType.length; i++)
	{
		this.m_arBonuses [i] = 0;
	}
}
// Update the net and bonuses
CBonusNet.prototype.update = function(Ball, deltaTime) {
	var i;
	for (i = 0; i < this.m_arElement.length; i++) {
		this.m_bBonusesUpdated = this.m_arElement [i].update (Ball, deltaTime, this.m_arBonuses) || this.m_bBonusesUpdated;
	}
	return this
}
