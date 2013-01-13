//----------------------------------------------------------------------------
// Tools functions
//----------------------------------------------------------------------------
/**
 * @author RX
 */
function cross2D (a, b) {
    return (a.x * b.y) - (a.y * b.x)
}
function dot2D (a, b) {
	return (a.x * b.x) + (a.y * b.y)
}
function dot3Vectors (a, b, c) {
	return ((b.x - a.x) * (c.x - a.x)) + ((b.y - a.y) * (c.y - a.y)) + ((b.z - a.z) * (c.z - a.z))
}
function distToSegmentOnPlane (A, B, P, normal) {
	var vAB = new THREE.Vector3 (B.x - A.x, B.y - A.y, B.z - A.z);
	var vAP = new THREE.Vector3 (P.x - A.x, P.y - A.y, P.z - A.z);
	vAB.crossSelf (vAP);
	return vAB.dot (normal)
}
function isPointIntoQuad (vA, vB, vC, vD, vN, vP) {
	var fDistAB = distToSegmentOnPlane (vA, vB, vP, vN);
	var fDistBC = distToSegmentOnPlane (vB, vC, vP, vN);
	var fDistCD = distToSegmentOnPlane (vC, vD, vP, vN);
	var fDistDA = distToSegmentOnPlane (vD, vA, vP, vN);
	return ((fDistAB >= 0 && fDistBC >= 0 && fDistCD >= 0 && fDistDA >= 0) || (fDistAB <= 0 && fDistBC <= 0 && fDistCD <= 0 && fDistDA <= 0));
}
function applyMatrix (v, matrix) {
	var a = matrix.elements, c = v.x, d = v.y, e = v.z;
	v.x = a[0] * c + a[4] * d + a[8]  * e + a[12];
	v.y = a[1] * c + a[5] * d + a[9]  * e + a[13];
	v.z = a[2] * c + a[6] * d + a[10] * e + a[14];
	return a
}
function applyRotationMatrix (v, matrix) {
	var a = matrix.elements, c = v.x, d = v.y, e = v.z;
	v.x = a[0] * c + a[4] * d + a[8]  * e;
	v.y = a[1] * c + a[5] * d + a[9]  * e;
	v.z = a[2] * c + a[6] * d + a[10] * e;
	return a
}