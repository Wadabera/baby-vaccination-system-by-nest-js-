<?php include("./parts/header.php") ?>
    <!--HEADER -->
    <header id="main-header" class="py-2 bg-primary text-white">
      <div class="container">
        <div class="row">
          <div class="col-md-6">
            <h1><i class="fa fa-gear"></i> Settings</h1>
          </div>
        </div>
      </div>
    </header>
    <!--ACTIONS BUTTONS-->

    <section id="action" class="py-4 mb-4 bg-light">
      <div class="container">
        <div class="row">
          <div class="col-md-3 mr-auto">
            <a href="index.html" class="btn btn-light btn-block"
              ><i class="fa fa-arrow-left"></i> Back to dashboard</a
            >
          </div>
          <div class="col-md-3">
            <a href="#" class="btn btn-success btn-block"
              ><i class="fa fa-check"> Save Changes</i></a
            >
          </div>
        </div>
      </div>
    </section>

    <section id="settings">
      <div class="container">
        <div class="row">
          <div class="col">
            <div class="card">
              <div class="card-header">
                <h4>Edit Settings</h4>
              </div>
              <div class="card-body">
                <form>
                  <fieldset class="form-group">
                    <legend>Allow user Registration</legend>
                    <div class="form-check">
                      <label for="" class="form-check-label">
                        <input
                          type="radio"
                          name=""
                          id=""
                          class="form-check-input"
                          value="Yes"
                          checked
                        />
                        Yes
                      </label>
                    </div>
                    <div class="form-check">
                      <label for="" class="form-check-label">
                        <input
                          type="radio"
                          name=""
                          id=""
                          class="form-check-input"
                          value="No"
                          checked
                        />
                        No
                      </label>
                    </div>
                  </fieldset>
                  <fieldset class="form-group">
                    <legend>Home Page Formats</legend>
                    <div class="form-check">
                      <label for="" class="form-check-label">
                        <input
                          type="radio"
                          name=""
                          id=""
                          class="form-check-input"
                          value="post"
                          checked
                        />
                        Post Index
                      </label>
                    </div>
                    <div class="form-check">
                      <label for="" class="form-check-label">
                        <input
                          type="radio"
                          name=""
                          id=""
                          class="form-check-input"
                          value="single"
                          checked
                        />
                        Single Page
                      </label>
                    </div>
                  </fieldset>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>



    <?php  include("./parts/footer.php") ?>