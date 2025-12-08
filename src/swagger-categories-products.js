/**
 * @swagger
 * /v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Categories
 *     description: Retrieve all active categories with optional hierarchy
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create new category (Admin only)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     description: Create a new product category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Salon Moderne"
 *               slug:
 *                 type: string
 *                 example: "salon-moderne"
 *               description:
 *                 type: string
 *                 example: "Canapés et meubles de salon"
 *               sortOrder:
 *                 type: integer
 *                 example: 5
 *               parent:
 *                 type: string
 *                 example: null
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *
 * /v1/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         description: Category not found
 *
 *   put:
 *     summary: Update category (Admin only)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Category updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *
 *   delete:
 *     summary: Delete category (Admin only)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *
 * /v1/categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category found
 *       404:
 *         description: Category not found
 *
 * /v1/product-types:
 *   get:
 *     summary: Get all product types
 *     tags:
 *       - Product Types
 *     description: Retrieve all product types
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of product types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductType'
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create new product type (Admin only)
 *     tags:
 *       - Product Types
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Chaise"
 *               code:
 *                 type: string
 *                 example: "CHAISE"
 *               description:
 *                 type: string
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     fieldType:
 *                       type: string
 *                     required:
 *                       type: boolean
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *     responses:
 *       201:
 *         description: Product type created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *
 * /v1/product-types/{id}:
 *   get:
 *     summary: Get product type by ID
 *     tags:
 *       - Product Types
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product type found
 *       404:
 *         description: Not found
 *
 *   put:
 *     summary: Update product type (Admin only)
 *     tags:
 *       - Product Types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated successfully
 *       401:
 *         description: Unauthorized
 *
 *   delete:
 *     summary: Delete product type (Admin only)
 *     tags:
 *       - Product Types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted successfully
 *       401:
 *         description: Unauthorized
 *
 * /v1/product-types/code/{code}:
 *   get:
 *     summary: Get product type by code
 *     tags:
 *       - Product Types
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product type found
 *       404:
 *         description: Not found
 *
 * /v1/product-types/generate-sku:
 *   post:
 *     summary: Generate SKU automatically
 *     tags:
 *       - Product Types
 *     security:
 *       - bearerAuth: []
 *     description: Generate a unique SKU based on product type, category, and variant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productTypeCode
 *               - categorySlug
 *             properties:
 *               productTypeCode:
 *                 type: string
 *                 example: "LIT"
 *               categorySlug:
 *                 type: string
 *                 example: "chambres"
 *               variant:
 *                 type: string
 *                 example: "double-bois"
 *     responses:
 *       200:
 *         description: SKU generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     sku:
 *                       type: string
 *                       example: "LIT-CHAMBRES-DOUBLE-BOIS-2847"
 *                     productType:
 *                       type: string
 *                     category:
 *                       type: string
 *                     variant:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product type not found
 */
