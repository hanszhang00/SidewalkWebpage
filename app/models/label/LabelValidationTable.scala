package models.label

import java.sql.Timestamp
import java.util.UUID
import models.utils.MyPostgresDriver.simple._
import play.api.Play.current
import play.api.libs.json.{JsObject, Json}

import scala.slick.jdbc.{GetResult, StaticQuery => Q}
import scala.slick.lifted.ForeignKeyQuery

case class LabelValidation(validationId: Int,
                           labelId: Int,
                           labelValidationId: Int,
                           userId: String,
                           missionId: Int,
                           canvasX: Int,
                           canvasY: Int,
                           heading: Float,
                           pitch: Float,
                           zoom: Float,
                           canvasHeight: Int,
                           canvasWidth: Int,
                           startTimestamp: java.sql.Timestamp,
                           endTimestamp: java.sql.Timestamp)


/**
  * Stores data from each validation interaction
  * https://www.programcreek.com/scala/slick.lifted.ForeignKeyQuery
  * @param tag
  */
class LabelValidationTable (tag: slick.lifted.Tag) extends Table[LabelValidation](tag, Some("sidewalk"), "label_validation") {
  def labelValidationId = column[Int]("label_validation_id", O.AutoInc)
  def labelId = column[Int]("label_id", O.NotNull)
  def validationResult = column[Int]("validation_result", O.NotNull)
  def userId = column[String]("user_id", O.NotNull)
  def missionId = column[Int]("mission_id", O.NotNull)
  def canvasX = column[Int]("canvas_x", O.NotNull)
  def canvasY = column[Int]("canvas_y", O.NotNull)
  def heading = column[Float]("heading", O.NotNull)
  def pitch = column[Float]("pitch", O.NotNull)
  def zoom = column[Float]("zoom", O.NotNull)
  def canvasHeight = column[Int]("canvas_height", O.NotNull)
  def canvasWidth = column[Int]("canvas_width", O.NotNull)
  def startTimestamp = column[java.sql.Timestamp]("start_timestamp", O.NotNull)
  def endTimestamp = column[java.sql.Timestamp]("end_timestamp", O.NotNull)

  def * = (labelValidationId, labelId, validationResult, userId, missionId, canvasX, canvasY,
    heading, pitch, zoom, canvasHeight, canvasWidth, startTimestamp, endTimestamp) <>
    ((LabelValidation.apply _).tupled, LabelValidation.unapply)
}

/**
  * Data access table for label validation table
  */
object LabelValidationTable {
  val db = play.api.db.slick.DB
  val validationLabels = TableQuery[LabelValidationTable]

  /**
    * Returns how many agree, disagree, or unsure validations a user entered for a given mission
    * @param missionId  Mission ID of mission
    * @param result     Validation result (1 - agree, 2 - disagree, 3 - unsure)
    * @return           Number of labels that were
    */
  def countResultsFromValidationMission(missionId: Int, result: Int): Int = db.withSession { implicit session =>
    validationLabels.filter(_.missionId === missionId).filter(_.validationResult === result).list.size
  }

  /**
    * Gets a JSON object that holds additional information about the number of label validation
    * results for the current mission
    * @param missionId  Mission ID of the current mission
    * @return           JSON Object with information about agree/disagree/not sure counts
    */
  def getValidationProgress (missionId: Int): JsObject = {
    val agreeCount: Int = countResultsFromValidationMission(missionId, 1)
    val disagreeCount: Int = countResultsFromValidationMission(missionId, 2)
    val notSureCount: Int = countResultsFromValidationMission(missionId, 3)

    Json.obj(
      "agree_count" -> agreeCount,
      "disagree_count" -> disagreeCount,
      "not_sure_count" -> notSureCount
    )
  }

  def save(label: LabelValidation): Int = db.withTransaction { implicit session =>
    val labelValidationId: Int =
      (validationLabels returning validationLabels.map(_.labelValidationId)) += label
    labelValidationId
  }
}
