//-----------------------------------
// Class CBall : manage the ball
//-----------------------------------
/**
 * @author RX
 */
CBall = function (inRadius)
{
    var Geometry = new THREE.SphereGeometry ( inRadius, 20, 20 );
	var Material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF } );
	this.m_fRadius = inRadius;
	this.m_Mesh = new THREE.Mesh( Geometry, Material );
	this.m_Velocity = 1;
	this.m_Dir = new THREE.Vector3 (0, 0, 1);
}
CBall.prototype.init = function() {
	var fAngle = -Math.PI / 4;
	fAngle = Math.random () * Math.PI * 2;
	while (Math.abs (fAngle) < 0.1 || Math.abs (Math.PI - fAngle) < 0.1) {
		fAngle = Math.random () * Math.PI * 2;
	}
	this.m_Dir.x = Math.cos(fAngle);
	this.m_Dir.y = 0;
	this.m_Dir.z = Math.sin(fAngle);
}
CBall.prototype.move = function(deltaTime, collisions) {
	var fAdvance  = this.m_Velocity * deltaTime;
	if (fAdvance != 0) {
		var vPosStart = new THREE.Vector3 (this.m_Mesh.position.x, this.m_Mesh.position.y, this.m_Mesh.position.z);
		var vPosStop = new THREE.Vector3 (vPosStart.x + this.m_Dir.x * fAdvance, vPosStart.y + this.m_Dir.y * fAdvance, vPosStart.z + this.m_Dir.z * fAdvance);
		if (collisions.collide (vPosStart, vPosStop, this)) {
			// Il y a eu collision : il faut recalculer la direction
			this.m_Dir.x = vPosStop.x - vPosStart.x;
			this.m_Dir.y = vPosStop.y - vPosStart.y;
			this.m_Dir.z = vPosStop.z - vPosStart.z;
			this.m_Dir.normalize ();
		}
		this.m_Mesh.position.x = vPosStop.x;
		this.m_Mesh.position.y = vPosStop.y;
		this.m_Mesh.position.z = vPosStop.z;
	}
	return this
}
CBall.prototype.addVelocity = function(x, y, z) {
	this.m_Dir.x += x;
	this.m_Dir.y += y;
	this.m_Dir.z += z;
	this.m_Dir.normalize ();
}