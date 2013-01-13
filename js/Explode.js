/**
 * @author RX
 */
//----------------------------------------------------------------------------
// Class CExplode : generate a particle system based on a mesh to simulate an explosion
//----------------------------------------------------------------------------
CExplode = function(mesh, particlesCountBy100Pixels, particlesLifeTime) {
    this.m_Particles = new THREE.Geometry ();
	this.m_pMaterial = new THREE.ParticleBasicMaterial({color: 0xFFFFFF,size: 40,map: THREE.ImageUtils.loadTexture("images/GlowSphere.png"), blending: THREE.AdditiveBlending, transparent: true});
	this.m_iParticlesLifeTime = 1000;
	this.m_iExplosionTime = 0;
	this.m_fGravity = 0.0006;
	this.m_arVelocity = new Array ();
	this.m_ParticleSystem = new THREE.ParticleSystem (this.m_Particles, this.m_pMaterial);
	this.init (mesh, particlesCountBy100Pixels, particlesLifeTime);
	this.m_ParticleSystem.visible = false;
	this.m_ParticleSystem.opacity = 0.5;
	this.m_ParticleSystem.sortParticles = true;
}
CExplode.prototype.init = function(mesh, particlesCountBy100Pixels, particlesLifeTime) {
	// Le centre du mesh va servir de centre de l'explosion : on le calcule
	this.m_iParticlesLifeTime = particlesLifeTime;
	this.m_iExplosionTime = 0;
	var vCenter  = new THREE.Vector3 (0, 0, 0); 
	var fBottomY = 0.0; 
	if (mesh.geometry.vertices.length) {
		fBottomY = mesh.geometry.vertices [0].y;
	}
	for (var i = 0; i < mesh.geometry.vertices.length; i++) {
		vP = mesh.geometry.vertices [i];
		vCenter.addSelf (vP);
		if (vP.y < fBottomY) fBottomY = vP.y;
	}
	vCenter.multiplyScalar (1.0 / mesh.geometry.vertices.length);
	vCenter.addSelf (mesh.position);
	vCenter.y = fBottomY;
	// On génère les particules représentant le mesh
	var iParticleCount = 0;
	for (var i = 0; i < mesh.geometry.faces.length; i++) {
		var face = mesh.geometry.faces [i];
		// Calcul du nombre de particules pour cette face
		var vA = mesh.geometry.vertices [face.a].clone ();
		var vB = mesh.geometry.vertices [face.b].clone ();
		var vC = mesh.geometry.vertices [face.c].clone ();
		var vD = mesh.geometry.vertices [face.d].clone ();
		var vAB = vB.clone (); vAB.subSelf (vA);
		var vAD = vD.clone (); vAD.subSelf (vA);
		var fAB = vAB.lengthSq ();
		var fAD = vAD.lengthSq ();
		var iNbFaceParticles = (fAB + fAD) * particlesCountBy100Pixels / 10000;
		for (var p = 0; p < iNbFaceParticles; p++) {
			var vP = vA.clone ();
			var vPAB = vAB.clone ();
			var vPAD = vAD.clone ();
			vPAB.multiplyScalar (Math.random ());
			vPAD.multiplyScalar (Math.random ());
			vP.addSelf (mesh.position);
			vP.addSelf (vPAB); 
			vP.addSelf (vPAD); 
			var velocity = vP.clone (); velocity.subSelf (vCenter);
			velocity.x *= 0.001 * (Math.random () + 1.);
			velocity.y *= 0.005 * (Math.random () + 1.);
			velocity.z *= 0.005 * (Math.random () + 1.);
			this.m_arVelocity [iParticleCount] = velocity;
			this.m_Particles.vertices [iParticleCount] = vP;
			iParticleCount++;
		}
	}
	this.m_ParticleSystem.material.color = mesh.material.color;
	this.m_ParticleSystem.geometry.verticesNeedUpdate = true;
	this.m_ParticleSystem.visible = true;
}
// Update each particles
CExplode.prototype.update = function(deltaTime) {
	if (this.m_ParticleSystem && this.m_ParticleSystem.visible) {
		var delta = deltaTime;
		this.m_iExplosionTime += delta;
		for (var i = 0; i < this.m_Particles.vertices.length; i++) {
			var particle = this.m_Particles.vertices[i];
			var velocity = this.m_arVelocity[i];
			particle.x += velocity.x * delta;
			particle.y += velocity.y * delta;
			particle.z += velocity.z * delta;
			if (particle.y < 0) particle.y = 100000; 
			velocity.y -= this.m_fGravity * delta;
		}
		if (this.m_iExplosionTime < this.m_iParticlesLifeTime) {
			this.m_pMaterial.size = 40 * (1.0 - this.m_iExplosionTime / this.m_iParticlesLifeTime); 
		} else {
			this.m_pMaterial.size = 0;
			this.m_ParticleSystem.visible = false;
		}
		this.m_ParticleSystem.geometry.verticesNeedUpdate = true;
	}
}